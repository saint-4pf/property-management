const { query } = require('../config/database');

const leaseRepository = {

  findAll: async (filters = {}) => {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      conditions.push(`l.status = $${paramCount++}`);
      params.push(filters.status);
    }
    if (filters.tenant_id) {
      conditions.push(`l.tenant_id = $${paramCount++}`);
      params.push(filters.tenant_id);
    }
    if (filters.unit_id) {
      conditions.push(`l.unit_id = $${paramCount++}`);
      params.push(filters.unit_id);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const result = await query(`
      SELECT
        l.*,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        u.unit_number,
        b.name AS block_name
      FROM leases l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN units u ON u.id = l.unit_id
      JOIN blocks b ON b.id = u.block_id
      ${whereClause}
      ORDER BY l.start_date DESC
    `, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await query(`
      SELECT
        l.*,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        u.unit_number,
        b.name AS block_name,
        b.id AS block_id
      FROM leases l
      JOIN tenants t ON t.id = l.tenant_id
      JOIN units u ON u.id = l.unit_id
      JOIN blocks b ON b.id = u.block_id
      WHERE l.id = $1
    `, [id]);
    return result.rows[0];
  },

  findActiveByUnit: async (unit_id) => {
    const result = await query(
      `SELECT * FROM leases
       WHERE unit_id = $1 AND status = 'active'`,
      [unit_id]
    );
    return result.rows[0];
  },

  findActiveByTenant: async (tenant_id) => {
    const result = await query(
      `SELECT * FROM leases
       WHERE tenant_id = $1 AND status = 'active'`,
      [tenant_id]
    );
    return result.rows[0];
  },

  // Create lease — uses client for transactions
  create: async (data, client) => {
  const {
    unit_id, tenant_id, annual_rent,
    water_monthly, garbage_monthly,
    deposit_amount, deposit_paid,
    start_date, end_date
  } = data;

  const db = client ||
    { query: (t, p) => query(t, p) };

  const result = await db.query(
    `INSERT INTO leases
       (unit_id, tenant_id, annual_rent,
        water_monthly, garbage_monthly,
        deposit_amount, deposit_paid,
        start_date, end_date, status)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7,
        $8, $9, 'active')
     RETURNING *`,
    [
      unit_id,
      tenant_id,
      parseFloat(annual_rent),
      parseFloat(water_monthly) || 0,
      parseFloat(garbage_monthly) || 0,
      parseFloat(deposit_amount) || 0,
      deposit_paid || false,
      start_date,
      end_date
    ]
  );
  return result.rows[0];
},

  updateStatus: async (id, status,
    termination_reason = null, client = null) => {
    const db = client || { query: (t, p) => query(t, p) };
    const result = await db.query(
      `UPDATE leases
       SET status = $1,
           termination_reason = $2
       WHERE id = $3
       RETURNING *`,
      [status, termination_reason, id]
    );
    return result.rows[0];
  },

  // Leases expiring within N days — for alerts
  findExpiringSoon: async (days = 30) => {
    const result = await query(
      `SELECT
        l.*,
        t.full_name AS tenant_name,
        t.phone AS tenant_phone,
        u.unit_number,
        b.name AS block_name
       FROM leases l
       JOIN tenants t ON t.id = l.tenant_id
       JOIN units u ON u.id = l.unit_id
       JOIN blocks b ON b.id = u.block_id
       WHERE l.status = 'active'
       AND l.end_date <= CURRENT_DATE + $1
       ORDER BY l.end_date ASC`,
      [days]
    );
    return result.rows;
  }
};

module.exports = leaseRepository;