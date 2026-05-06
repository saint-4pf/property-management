const { query } = require('../config/database');

const maintenanceController = {

  getAll: async (req, res, next) => {
    try {
      const conditions = [];
      const params = [];
      let p = 1;

      if (req.query.status) {
        conditions.push(`m.status = $${p++}`);
        params.push(req.query.status);
      }
      if (req.query.block_id) {
        conditions.push(`m.block_id = $${p++}`);
        params.push(req.query.block_id);
      }

      const where = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      const result = await query(`
        SELECT
          m.*,
          u.unit_number,
          b.name AS block_name
        FROM maintenance_records m
        LEFT JOIN units u ON u.id = m.unit_id
        JOIN blocks b ON b.id = m.block_id
        ${where}
        ORDER BY
          CASE m.priority
            WHEN 'urgent' THEN 1
            WHEN 'high'   THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low'    THEN 4
          END,
          m.created_at DESC
      `, params);

      res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const result = await query(`
        SELECT
          m.*,
          u.unit_number,
          b.name AS block_name,
          json_agg(
            json_build_object(
              'id', t.id,
              'amount', t.amount,
              'category', t.category,
              'description', t.description,
              'transaction_date', t.transaction_date
            )
          ) FILTER (WHERE t.id IS NOT NULL)
            AS linked_expenses
        FROM maintenance_records m
        LEFT JOIN units u ON u.id = m.unit_id
        JOIN blocks b ON b.id = m.block_id
        LEFT JOIN maintenance_expenses me
          ON me.maintenance_id = m.id
        LEFT JOIN transactions t
          ON t.id = me.transaction_id
        WHERE m.id = $1
        GROUP BY m.id, u.unit_number, b.name
      `, [req.params.id]);

      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          error: 'Maintenance record not found'
        });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
  try {
    const {
      unit_id,
      block_id,
      title,
      description,
      work_done,
      reported_by,
      priority,
      reported_date
    } = req.body;

    const result = await query(`
      INSERT INTO maintenance_records
        (block_id, unit_id, title, description,
         work_done, reported_by,
         priority, status, reported_date)
      VALUES
        ($1, $2, $3, $4, $5, $6,
         $7, 'reported', $8)
      RETURNING *
    `, [
      block_id,
      unit_id || null,
      title,
      description,
      work_done || null,
      reported_by || null,
      priority || 'medium',
      reported_date || new Date()
        .toISOString().slice(0, 10)
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Maintenance record created'
    });
  } catch (err) {
    next(err);
  }
},

  update: async (req, res, next) => {
  try {
    const {
      title,
      description,
      work_done,
      priority,
      status,
      completed_date
    } = req.body;

    const result = await query(`
      UPDATE maintenance_records
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        work_done = COALESCE($3, work_done),
        priority = COALESCE($4, priority),
        status = COALESCE($5, status),
        completed_date = COALESCE($6, completed_date)
      WHERE id = $7
      RETURNING *
    `, [
      title || null,
      description || null,
      work_done || null,
      priority || null,
      status || null,
      completed_date || null,
      req.params.id
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
},
  // Link a transaction (expense) to a maintenance record
  linkExpense: async (req, res, next) => {
    try {
      const { transaction_id } = req.body;
      const result = await query(`
        INSERT INTO maintenance_expenses
          (maintenance_id, transaction_id)
        VALUES ($1, $2)
        RETURNING *
      `, [req.params.id, transaction_id]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Expense linked to maintenance record'
      });
    } catch (err) { next(err); }
  }
};

module.exports = maintenanceController;