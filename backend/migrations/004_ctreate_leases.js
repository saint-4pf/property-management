exports.up = (pgm) => {
  pgm.createTable('leases', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    // ── Core Relationships ──────────────────────────
    unit_id: {
      type: 'uuid',
      notNull: true,
      references: '"units"',
      onDelete: 'RESTRICT'
    },

    tenant_id: {
      type: 'uuid',
      notNull: true,
      references: '"tenants"',
      onDelete: 'RESTRICT'
    },

    // ── Financial Terms ─────────────────────────────
    annual_rent: {
      type: 'numeric(12,2)',
      notNull: true
      // Total rent due for the full lease year
      // e.g. KES 180,000
    },

    // Utility charges — fixed monthly amounts
    // set once when lease is created
    water_monthly: {
      type: 'numeric(10,2)',
      notNull: true,
      default: 0
    },

    garbage_monthly: {
      type: 'numeric(10,2)',
      notNull: true,
      default: 0
    },

    // Security deposit — tracked separately from rent
    deposit_amount: {
      type: 'numeric(12,2)',
      notNull: true,
      default: 0
    },

    deposit_paid: {
      type: 'boolean',
      notNull: true,
      default: false
    },

    // ── Lease Period ────────────────────────────────
    start_date: {
      type: 'date',
      notNull: true
    },

    end_date: {
      type: 'date',
      notNull: true
    },

    // ── Status ──────────────────────────────────────
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'active'",
      check: "status IN ('active', 'expired', 'terminated', 'pending')"
    },

    // Termination reason — if ended early
    termination_reason: {
      type: 'text',
      notNull: false
    },

    // ── Audit ────────────────────────────────────────
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

  // THE MOST IMPORTANT CONSTRAINT IN THE SYSTEM
  // A unit cannot have two ACTIVE leases at the same time
  // This is enforced at the database level — not just application level
  pgm.sql(`
    CREATE UNIQUE INDEX one_active_lease_per_unit
    ON leases (unit_id)
    WHERE status = 'active';
  `);

  // Also prevent overlapping lease dates for same unit
  // Requires btree_gist extension
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS btree_gist;

    ALTER TABLE leases
    ADD CONSTRAINT no_overlapping_leases
    EXCLUDE USING gist (
      unit_id WITH =,
      daterange(start_date, end_date, '[]') WITH &&
    )
    WHERE (status != 'terminated');
  `);

  pgm.createIndex('leases', 'unit_id');
  pgm.createIndex('leases', 'tenant_id');
  pgm.createIndex('leases', 'status');
  pgm.createIndex('leases', 'end_date');  // For expiry alerts

  pgm.sql(`
    CREATE TRIGGER leases_updated_at
    BEFORE UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP EXTENSION IF EXISTS btree_gist;');
  pgm.dropTable('leases');
};