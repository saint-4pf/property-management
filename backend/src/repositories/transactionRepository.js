const { query } = require('../config/database');

const transactionRepository = {

  findAll: async (filters = {}) => {
    const conditions = ['t.is_voided = false'];
    const params = [];
    let p = 1;

    if (filters.account) {
      conditions.push(`t.account = $${p++}`);
      params.push(filters.account);
    }
    if (filters.type) {
      conditions.push(`t.type = $${p++}`);
      params.push(filters.type);
    }
    if (filters.lease_id) {
      conditions.push(`t.lease_id = $${p++}`);
      params.push(filters.lease_id);
    }
    if (filters.tenant_id) {
      conditions.push(`t.tenant_id = $${p++}`);
      params.push(filters.tenant_id);
    }
    if (filters.block_id) {
      conditions.push(`t.block_id = $${p++}`);
      params.push(filters.block_id);
    }
    if (filters.date_from) {
      conditions.push(`t.transaction_date >= $${p++}`);
      params.push(filters.date_from);
    }
    if (filters.date_to) {
      conditions.push(`t.transaction_date <= $${p++}`);
      params.push(filters.date_to);
    }
    if (filters.category) {
      conditions.push(`t.category = $${p++}`);
      params.push(filters.category);
    }

    const result = await query(`
      SELECT
        t.*,
        ten.full_name AS tenant_name,
        u.unit_number,
        b.name AS block_name
      FROM transactions t
      LEFT JOIN tenants ten ON ten.id = t.tenant_id
      LEFT JOIN units u ON u.id = t.unit_id
      LEFT JOIN blocks b ON b.id = t.block_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.transaction_date DESC,
               t.created_at DESC
      LIMIT $${p++} OFFSET $${p++}
    `, [...params, filters.limit || 50,
        filters.offset || 0]);

    return result.rows;
  },

  findById: async (id) => {
    const result = await query(`
      SELECT
        t.*,
        ten.full_name AS tenant_name,
        u.unit_number,
        b.name AS block_name
      FROM transactions t
      LEFT JOIN tenants ten ON ten.id = t.tenant_id
      LEFT JOIN units u ON u.id = t.unit_id
      LEFT JOIN blocks b ON b.id = t.block_id
      WHERE t.id = $1
    `, [id]);
    return result.rows[0];
  },

  create: async (data, client = null) => {
  const db = client ||
    { query: (t, p) => query(t, p) };

  const {
    transaction_date,
    type,
    amount,
    account,
    category,
    lease_id,
    tenant_id,
    unit_id,
    block_id,
    billing_month,
    payment_method,
    reference_number,
    description
  } = data;

  const result = await db.query(
    `INSERT INTO transactions
       (transaction_date, type, amount,
        account, category, lease_id,
        tenant_id, unit_id, block_id,
        billing_month, payment_method,
        reference_number, description)
     VALUES
       ($1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13)
     RETURNING *`,
    [
      transaction_date || new Date(),
      type,
      parseFloat(amount),
      account,
      category,
      lease_id || null,
      tenant_id || null,
      unit_id || null,
      block_id || null,
      billing_month || null,
      payment_method || 'cash',
      reference_number || null,
      description || null
    ]
  );
  return result.rows[0];
},
  void: async (id, reason) => {
    const result = await query(
      `UPDATE transactions
       SET is_voided = true,
           voided_reason = $1,
           voided_at = now()
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );
    return result.rows[0];
  },

  // ── Financial Calculation Queries ──────────────────

  // Account balance — the core financial query
  getAccountBalance: async (account) => {
    const result = await query(`
      SELECT
        account,
        SUM(CASE WHEN type = 'income'
            THEN amount ELSE 0 END)
          AS total_income,
        SUM(CASE WHEN type = 'expense'
            THEN amount ELSE 0 END)
          AS total_expenses,
        SUM(CASE WHEN type = 'income'
            THEN amount ELSE -amount END)
          AS balance
      FROM transactions
      WHERE account = $1
        AND is_voided = false
      GROUP BY account
    `, [account]);
    return result.rows[0];
  },

  // All three account balances at once
  getAllAccountBalances: async () => {
    const result = await query(`
      SELECT
        account,
        SUM(CASE WHEN type = 'income'
            THEN amount ELSE 0 END)
          AS total_income,
        SUM(CASE WHEN type = 'expense'
            THEN amount ELSE 0 END)
          AS total_expenses,
        SUM(CASE WHEN type = 'income'
            THEN amount ELSE -amount END)
          AS balance
      FROM transactions
      WHERE is_voided = false
      GROUP BY account
      ORDER BY account
    `);
    return result.rows;
  },

  // Rent paid for a specific lease
  getRentPaidForLease: async (lease_id) => {
    const result = await query(`
      SELECT COALESCE(SUM(amount), 0) AS total_paid
      FROM transactions
      WHERE lease_id = $1
        AND category = 'rent'
        AND type = 'income'
        AND is_voided = false
    `, [lease_id]);
    return parseFloat(result.rows[0].total_paid);
  },

  // Utility paid for a lease in a specific month
  getUtilityPaidForMonth: async (lease_id, billing_month) => {
    const result = await query(`
      SELECT
        COALESCE(SUM(amount)
          FILTER (WHERE category = 'utility_water'), 0)
          AS water_paid,
        COALESCE(SUM(amount)
          FILTER (WHERE category = 'utility_garbage'), 0)
          AS garbage_paid,
        COALESCE(SUM(amount), 0) AS total_paid
      FROM transactions
      WHERE lease_id = $1
        AND billing_month = $2
        AND type = 'income'
        AND is_voided = false
    `, [lease_id, billing_month]);
    return result.rows[0];
  },

  // All unpaid utility months for a lease
  getUnpaidUtilityMonths: async (lease_id,
    start_date, end_date) => {
    const result = await query(`
      WITH months AS (
        SELECT TO_CHAR(
          generate_series(
            DATE_TRUNC('month', $2::date),
            DATE_TRUNC('month', LEAST($3::date,
              CURRENT_DATE)),
            '1 month'::interval
          ), 'YYYY-MM'
        ) AS billing_month
      ),
      paid_months AS (
        SELECT DISTINCT billing_month
        FROM transactions
        WHERE lease_id = $1
          AND type = 'income'
          AND category IN (
            'utility_water','utility_garbage'
          )
          AND is_voided = false
      )
      SELECT m.billing_month
      FROM months m
      LEFT JOIN paid_months p
        ON p.billing_month = m.billing_month
      WHERE p.billing_month IS NULL
      ORDER BY m.billing_month
    `, [lease_id, start_date, end_date]);
    return result.rows.map(r => r.billing_month);
  }
};

module.exports = transactionRepository;