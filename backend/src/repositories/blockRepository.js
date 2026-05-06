const { query } = require('../config/database');

const blockRepository = {

  // Get all active blocks
  findAll: async () => {
    const result = await query(`
      SELECT
        b.*,
        COUNT(u.id) AS total_units,
        COUNT(u.id) FILTER (WHERE u.status = 'occupied')
          AS occupied_units,
        COUNT(u.id) FILTER (WHERE u.status = 'vacant')
          AS vacant_units
      FROM blocks b
      LEFT JOIN units u
        ON u.block_id = b.id
        AND u.is_active = true
      WHERE b.is_active = true
      GROUP BY b.id
      ORDER BY b.name ASC
    `);
    return result.rows;
  },

  // Find one block by ID
  findById: async (id) => {
    const result = await query(
      `SELECT * FROM blocks WHERE id = $1 AND is_active = true`,
      [id]
    );
    return result.rows[0];
  },

  // Find block by name
  findByName: async (name) => {
    const result = await query(
      `SELECT * FROM blocks
       WHERE UPPER(name) = UPPER($1)
       AND is_active = true`,
      [name]
    );
    return result.rows[0];
  },

  // Create new block
 create: async (data) => {
  const { name, description } = data;
  const result = await query(
    `INSERT INTO blocks
       (name, description, is_active)
     VALUES
       ($1, $2, true)
     RETURNING *`,
    [
      name.toUpperCase(),
      description || null
    ]
  );
  return result.rows[0];
},

  // Update block
  update: async (id, data) => {
    const { name, description } = data;
    const result = await query(
      `UPDATE blocks
       SET name = COALESCE($1, name),
           description = COALESCE($2, description)
       WHERE id = $3 AND is_active = true
       RETURNING *`,
      [name?.toUpperCase(), description, id]
    );
    return result.rows[0];
  },

  // Soft delete
  softDelete: async (id) => {
    const result = await query(
      `UPDATE blocks
       SET is_active = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = blockRepository;