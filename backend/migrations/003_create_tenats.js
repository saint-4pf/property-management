exports.up = (pgm) => {
  pgm.createTable('tenants', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    full_name: {
      type: 'varchar(150)',
      notNull: true
    },

    phone: {
      type: 'varchar(20)',
      notNull: true
    },

    email: {
      type: 'varchar(150)',
      notNull: false
    },

    national_id: {
      type: 'varchar(30)',
      notNull: false,
      unique: true    // No two tenants share an ID number
    },

    emergency_contact_name: {
      type: 'varchar(150)',
      notNull: false
    },

    emergency_contact_phone: {
      type: 'varchar(20)',
      notNull: false
    },

    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'active'",
      check: "status IN ('active', 'inactive', 'blacklisted')"
      // blacklisted = left with unpaid dues,
      // system flags them if they try to re-lease
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

  pgm.createIndex('tenants', 'status');
  pgm.createIndex('tenants', 'phone');

  pgm.sql(`
    CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('tenants');
};