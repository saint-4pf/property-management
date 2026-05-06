const { query } = require('../config/database');

const unitRepository = {

  findAll: async (filters = {}) => {
    const conditions = ['u.is_active = true'];
    const params = [];
    let paramCount = 1;

    if (filters.block_id) {
      conditions.push(`u.block_id = $${paramCount++}`);
      params.push(filters.block_id);
    }

    if (filters.status) {
      conditions.push(`u.status = $${paramCount++}`);
      params.push(filters.status);
    }

    const result = await query(`
      SELECT
        u.*,
        b.name AS block_name,
        t.full_name AS current_tenant_name,
        t.phone AS current_tenant_phone
      FROM units u
      JOIN blocks b ON b.id = u.block_id
      LEFT JOIN leases l
        ON l.unit_id = u.id
        AND l.status = 'active'
      LEFT JOIN tenants t ON t.id = l.tenant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.name ASC, u.unit_number ASC
    `, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await query(`
      SELECT
        u.*,
        b.name AS block_name,
        t.full_name AS current_tenant_name,
        l.id AS active_lease_id,
        l.annual_rent,
        l.start_date,
        l.end_date
      FROM units u
      JOIN blocks b ON b.id = u.block_id
      LEFT JOIN leases l
        ON l.unit_id = u.id
        AND l.status = 'active'
      LEFT JOIN tenants t ON t.id = l.tenant_id
      WHERE u.id = $1 AND u.is_active = true
    `, [id]);
    return result.rows[0];
  },

  findByBlockAndNumber: async (block_id, unit_number) => {
    const result = await query(
      `SELECT * FROM units
       WHERE block_id = $1
       AND UPPER(unit_number) = UPPER($2)
       AND is_active = true`,
      [block_id, unit_number]
    );
    return result.rows[0];
  },

  create: async (data) => {
    const {
      block_id,
      unit_number,
      unit_type,
      size_description,
      base_rent,
      notes
    } = data;

    const result = await query(
      `INSERT INTO units
         (block_id, unit_number, unit_type,
          size_description, base_rent,
          status, is_active, notes)
       VALUES
         ($1, $2, $3, $4, $5,
          'vacant', true, $6)
       RETURNING *`,
      [
        block_id,
        unit_number.toUpperCase(),
        unit_type || 'residential',
        size_description || null,
        parseFloat(base_rent),
        notes || null
      ]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const {
      unit_type,
      size_description,
      base_rent,
      status,
      notes
    } = data;

    const result = await query(
      `UPDATE units
       SET
         unit_type = COALESCE($1, unit_type),
         size_description =
           COALESCE($2, size_description),
         base_rent = COALESCE($3, base_rent),
         status = COALESCE($4, status),
         notes = COALESCE($5, notes)
       WHERE id = $6
         AND is_active = true
       RETURNING *`,
      [
        unit_type || null,
        size_description || null,
        base_rent ? parseFloat(base_rent) : null,
        status || null,
        notes || null,
        id
      ]
    );
    return result.rows[0];
  },

  updateStatus: async (id, status, client = null) => {
    const db = client
      ? client
      : { query: (text, params) => query(text, params) };

    const result = await db.query(
      `UPDATE units
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  softDelete: async (id) => {
    const result = await query(
      `UPDATE units
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = unitRepository;