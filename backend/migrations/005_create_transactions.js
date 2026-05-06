exports.up = (pgm) => {
  pgm.createTable('transactions', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    // ── Financial Data ───────────────────────────────
    transaction_date: {
      type: 'date',
      notNull: true,
      default: pgm.func('current_date')
    },

    type: {
      type: 'varchar(10)',
      notNull: true,
      check: "type IN ('income', 'expense')"
    },

    amount: {
      type: 'numeric(12,2)',
      notNull: true,
      // Amount is always positive
      // The "type" column tells us if it's in or out
      check: 'amount > 0'
    },

    account: {
      type: 'varchar(20)',
      notNull: true,
      check: "account IN ('rent', 'utility', 'imprest')"
      // Which account this transaction belongs to
    },

    category: {
      type: 'varchar(50)',
      notNull: true
      // rent | utility_water | utility_garbage |
      // diesel | repairs | salaries | transport |
      // materials | deposit | other
    },

    // ── Relationships (all optional for flexibility) ──
    lease_id: {
      type: 'uuid',
      notNull: false,
      references: '"leases"',
      onDelete: 'RESTRICT'
      // Rent and utility payments link to a lease
      // Imprest expenses may not have a lease
    },

    tenant_id: {
      type: 'uuid',
      notNull: false,
      references: '"tenants"',
      onDelete: 'RESTRICT'
    },

    unit_id: {
      type: 'uuid',
      notNull: false,
      references: '"units"',
      onDelete: 'RESTRICT'
    },

    block_id: {
      type: 'uuid',
      notNull: false,
      references: '"blocks"',
      onDelete: 'RESTRICT'
    },

    // ── Utility Billing Month ───────────────────────
    // CRITICAL: tracks which month a utility payment covers
    // Format: 'YYYY-MM' e.g. '2025-03'
    // NULL for non-utility transactions
    billing_month: {
      type: 'varchar(7)',
      notNull: false,
      check: "billing_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'"
      // Regex ensures format is exactly YYYY-MM
    },

    // ── Payment Details ──────────────────────────────
    payment_method: {
      type: 'varchar(30)',
      notNull: false,
      default: "'cash'",
      check: "payment_method IN ('cash', 'mpesa', 'bank_transfer', 'cheque', 'other')"
    },

    reference_number: {
      type: 'varchar(100)',
      notNull: false
      // M-Pesa confirmation code, cheque number etc.
    },

    description: {
      type: 'text',
      notNull: false
    },

    // ── Audit & Integrity ────────────────────────────
    is_voided: {
      type: 'boolean',
      notNull: true,
      default: false
    },

    voided_reason: {
      type: 'text',
      notNull: false
    },

    voided_at: {
      type: 'timestamptz',
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

  // ── Indexes for Financial Queries ──────────────────
  // These make your balance calculations fast

  // Most common: get all transactions for an account
  pgm.createIndex('transactions', 'account');

  // Get all transactions for a tenant
  pgm.createIndex('transactions', 'tenant_id');

  // Get all transactions for a lease
  pgm.createIndex('transactions', 'lease_id');

  // Get transactions by date range (reports)
  pgm.createIndex('transactions', 'transaction_date');

  // Compound: account + date for account balance over period
  pgm.createIndex('transactions', ['account', 'transaction_date']);

  // Compound: tenant + billing_month for utility tracking
  pgm.createIndex('transactions', ['tenant_id', 'billing_month']);

  // Exclude voided from most queries
  pgm.createIndex('transactions', 'is_voided');

  // ── Business Rule Constraints ──────────────────────

  // Utility payments MUST have a billing_month
  pgm.sql(`
    ALTER TABLE transactions
    ADD CONSTRAINT utility_requires_billing_month
    CHECK (
      (category NOT IN ('utility_water', 'utility_garbage')
      OR billing_month IS NOT NULL)
    );
  `);

  // Category must match account type
  // This prevents diesel being charged to the rent account
  pgm.sql(`
    ALTER TABLE transactions
    ADD CONSTRAINT category_account_consistency
    CHECK (
      -- Rent payments only go to rent account
      (category = 'rent' AND account = 'rent')
      OR
      -- Utility payments only go to utility account
      (category IN ('utility_water', 'utility_garbage')
        AND account = 'utility')
      OR
      -- Operational expenses only go to imprest
      (category IN (
        'diesel', 'repairs', 'salaries',
        'transport', 'materials', 'other_expense'
      ) AND account = 'imprest')
      OR
      -- Deposit goes to rent account
      (category = 'deposit' AND account = 'rent')
      OR
      -- Income that isn't rent/utility goes to imprest
      (category = 'other_income' AND account = 'imprest')
    );
  `);

  pgm.sql(`
    CREATE TRIGGER transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('transactions');
};