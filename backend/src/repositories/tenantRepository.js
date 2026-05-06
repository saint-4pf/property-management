const { query } = require('../config/database');

const tenantRepository = {

  findAll: async (filters = {}) => {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      conditions.push(`t.status = $${paramCount++}`);
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push(
        `(t.full_name ILIKE $${paramCount}
          OR t.phone ILIKE $${paramCount})`
      );
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    const result = await query(`
      SELECT
        t.*,
        l.id AS active_lease_id,
        l.annual_rent,
        l.start_date,
        l.end_date,
        l.water_monthly,
        l.garbage_monthly,
        u.unit_number,
        b.name AS block_name
      FROM tenants t
      LEFT JOIN leases l
        ON l.tenant_id = t.id
        AND l.status = 'active'
      LEFT JOIN units u ON u.id = l.unit_id
      LEFT JOIN blocks b ON b.id = u.block_id
      ${whereClause}
      ORDER BY t.full_name ASC
    `, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await query(`
      SELECT
        t.*,
        l.id AS active_lease_id,
        l.annual_rent,
        l.start_date,
        l.end_date,
        l.water_monthly,
        l.garbage_monthly,
        l.deposit_amount,
        l.deposit_paid,
        u.id AS unit_id,
        u.unit_number,
        b.id AS block_id,
        b.name AS block_name
      FROM tenants t
      LEFT JOIN leases l
        ON l.tenant_id = t.id
        AND l.status = 'active'
      LEFT JOIN units u ON u.id = l.unit_id
      LEFT JOIN blocks b ON b.id = u.block_id
      WHERE t.id = $1
    `, [id]);
    return result.rows[0];
  },
create: async (data) => {
  const {
    full_name,
    phone,
    email,
    national_id,
    emergency_contact_name,
    emergency_contact_phone,
    notes
  } = data;

  const result = await query(
    `INSERT INTO tenants
       (full_name, phone, email, national_id,
        emergency_contact_name,
        emergency_contact_phone,
        status, notes)
     VALUES
       ($1, $2, $3, $4, $5, $6, 'active', $7)
     RETURNING *`,
    [
      full_name,
      phone,
      email || null,
      national_id || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      notes || null
    ]
  );
  return result.rows[0];
},
  
  update: async (id, data) => {
    const {
      full_name, phone, email,
      emergency_contact_name,
      emergency_contact_phone, status, notes
    } = data;
    const result = await query(
      `UPDATE tenants
       SET full_name = COALESCE($1, full_name),
           phone     = COALESCE($2, phone),
           email     = COALESCE($3, email),
           emergency_contact_name  =
             COALESCE($4, emergency_contact_name),
           emergency_contact_phone =
             COALESCE($5, emergency_contact_phone),
           status = COALESCE($6, status),
           notes  = COALESCE($7, notes)
       WHERE id = $8
       RETURNING *`,
      [
        full_name, phone, email,
        emergency_contact_name,
        emergency_contact_phone,
        status, notes, id
      ]
    );
    return result.rows[0];
  }
};

module.exports = tenantRepository;