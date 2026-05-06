exports.up = (pgm) => {
  pgm.createTable('blocks', {

    id: {
      type: 'uuid',
      primaryKey: true,
      // gen_random_uuid() generates a UUID automatically
      // UUIDs are better than serial integers because:
      // - They don't expose how many records you have
      // - Safe to generate on the client side if needed
      // - No collision risk when merging databases
      default: pgm.func('gen_random_uuid()')
    },

    name: {
      type: 'varchar(10)',
      notNull: true,
      unique: true    // Cannot have two blocks named "A"
    },

    description: {
      type: 'text',
      notNull: false  // Optional
    },

    is_active: {
      type: 'boolean',
      notNull: true,
      default: true   // Soft delete flag
    },

    created_at: {
      type: 'timestamptz',  // timestamptz = stores timezone info
      notNull: true,
      default: pgm.func('now()')
    },

    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Automatically update updated_at on every row change
  // This is a PostgreSQL trigger function
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER blocks_updated_at
    BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('blocks');
};