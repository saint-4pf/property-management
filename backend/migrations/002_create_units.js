exports.up = (pgm) => {
  pgm.createTable('units', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    block_id: {
      type: 'uuid',
      notNull: true,
      // Foreign key → a unit MUST belong to a block
      references: '"blocks"',
      // RESTRICT means: cannot delete a block
      // if it still has units
      onDelete: 'RESTRICT'
    },

    unit_number: {
      type: 'varchar(20)',
      notNull: true
      // e.g. "A1", "B12", "C3"
      // Unique constraint added below (compound)
    },

    unit_type: {
      type: 'varchar(20)',
      notNull: true,
      default: "'residential'",
      // Check constraint — only these values allowed
      check: "unit_type IN ('residential', 'commercial', 'storage')"
    },

    size_description: {
      type: 'varchar(50)',
      notNull: false
      // e.g. "2 bedroom", "shop 20sqm"
    },

    base_rent: {
      type: 'numeric(12,2)',
      notNull: true
      // numeric(12,2) = up to 12 digits, 2 decimal places
      // ALWAYS use numeric for money, NEVER float
      // float has rounding errors: 0.1 + 0.2 = 0.30000000000000004
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'vacant'",
      check: "status IN ('vacant', 'occupied', 'maintenance')"
    },

    is_active: {
      type: 'boolean',
      notNull: true,
      default: true
    },

    notes: {
      type: 'text',
      notNull: false
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Compound unique: unit_number must be unique WITHIN a block
  // "A1" can exist in Block A and Block B — but not twice in Block A
  pgm.addConstraint(
    'units',
    'units_block_unit_unique',
    'UNIQUE (block_id, unit_number)'
  );

  // Index for looking up units by block — very common query
  pgm.createIndex('units', 'block_id');
  pgm.createIndex('units', 'status');

  pgm.sql(`
    CREATE TRIGGER units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('units');
};