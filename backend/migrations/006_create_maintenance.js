exports.up = (pgm) => {
  pgm.createTable('maintenance_records', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    // Where is the issue?
    unit_id: {
      type: 'uuid',
      notNull: false,   // Some issues are block-wide
      references: '"units"',
      onDelete: 'RESTRICT'
    },

    block_id: {
      type: 'uuid',
      notNull: true,
      references: '"blocks"',
      onDelete: 'RESTRICT'
    },

    title: {
      type: 'varchar(200)',
      notNull: true
    },

    description: {
      type: 'text',
      notNull: true
    },

    // What was done / replaced
    work_done: {
      type: 'text',
      notNull: false
    },

    reported_by: {
      type: 'varchar(150)',
      notNull: false
      // Tenant name or staff name
    },

    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: "'medium'",
      check: "priority IN ('low', 'medium', 'high', 'urgent')"
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'reported'",
      check: "status IN ('reported', 'in_progress', 'completed', 'deferred')"
    },

    reported_date: {
      type: 'date',
      notNull: true,
      default: pgm.func('current_date')
    },

    completed_date: {
      type: 'date',
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

  pgm.createIndex('maintenance_records', 'unit_id');
  pgm.createIndex('maintenance_records', 'block_id');
  pgm.createIndex('maintenance_records', 'status');

  pgm.sql(`
    CREATE TRIGGER maintenance_updated_at
    BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('maintenance_records');
};