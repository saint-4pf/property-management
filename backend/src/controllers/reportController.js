const { query } = require('../config/database');

const reportController = {

  getDashboard: async (req, res, next) => {
    try {
      const [
        balances,
        occupancy,
        outstandingRent,
        recentTransactions,
        expenseBreakdown
      ] = await Promise.all([

        // All account balances
        query(`
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
        `),

        // Occupancy stats
        query(`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (
              WHERE status = 'occupied') AS occupied,
            COUNT(*) FILTER (
              WHERE status = 'vacant') AS vacant,
            COUNT(*) FILTER (
              WHERE status = 'maintenance')
              AS under_maintenance
          FROM units
          WHERE is_active = true
        `),

        // Tenants with outstanding rent
        query(`
          SELECT
            t.full_name AS tenant_name,
            t.phone,
            u.unit_number,
            b.name AS block_name,
            l.annual_rent,
            COALESCE(SUM(tx.amount) FILTER (
              WHERE tx.category = 'rent'
              AND tx.is_voided = false), 0)
              AS rent_paid,
            l.annual_rent - COALESCE(SUM(tx.amount)
              FILTER (WHERE tx.category = 'rent'
              AND tx.is_voided = false), 0)
              AS outstanding
          FROM leases l
          JOIN tenants t ON t.id = l.tenant_id
          JOIN units u ON u.id = l.unit_id
          JOIN blocks b ON b.id = u.block_id
          LEFT JOIN transactions tx
            ON tx.lease_id = l.id
          WHERE l.status = 'active'
          GROUP BY
            t.full_name, t.phone,
            u.unit_number, b.name,
            l.annual_rent
          HAVING
            l.annual_rent - COALESCE(SUM(tx.amount)
              FILTER (WHERE tx.category = 'rent'
              AND tx.is_voided = false), 0) > 0
          ORDER BY outstanding DESC
        `),

        // Last 10 transactions
        query(`
          SELECT
            tx.*,
            t.full_name AS tenant_name,
            u.unit_number
          FROM transactions tx
          LEFT JOIN tenants t ON t.id = tx.tenant_id
          LEFT JOIN units u ON u.id = tx.unit_id
          WHERE tx.is_voided = false
          ORDER BY tx.transaction_date DESC,
                   tx.created_at DESC
          LIMIT 10
        `),

        // Expense breakdown by category
        query(`
          SELECT
            category,
            SUM(amount) AS total,
            COUNT(*) AS count
          FROM transactions
          WHERE type = 'expense'
            AND is_voided = false
          GROUP BY category
          ORDER BY total DESC
        `)
      ]);

      res.json({
        success: true,
        data: {
          account_balances:    balances.rows,
          occupancy:           occupancy.rows[0],
          outstanding_rent:    outstandingRent.rows,
          recent_transactions: recentTransactions.rows,
          expense_breakdown:   expenseBreakdown.rows
        }
      });
    } catch (err) { next(err); }
  },

  getIncomeVsExpenses: async (req, res, next) => {
    try {
      const result = await query(`
        SELECT
          TO_CHAR(transaction_date, 'YYYY-MM')
            AS month,
          SUM(CASE WHEN type = 'income'
            THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'expense'
            THEN amount ELSE 0 END) AS expenses,
          SUM(CASE WHEN type = 'income'
            THEN amount ELSE -amount END) AS net
        FROM transactions
        WHERE is_voided = false
        GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
        ORDER BY month ASC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
  }
};

module.exports = reportController;