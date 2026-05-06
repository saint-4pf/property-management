exports.up = (pgm) => {
  pgm.createTable('maintenance_expenses', {

    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },

    maintenance_id: {
      type: 'uuid',
      notNull: true,
      references: '"maintenance_records"',
      onDelete: 'CASCADE'
      // If maintenance record deleted, links deleted too
      // (Only place we use CASCADE — no financial data here)
    },

    transaction_id: {
      type: 'uuid',
      notNull: true,
      references: '"transactions"',
      onDelete: 'RESTRICT'
      // Cannot delete a transaction linked to maintenance
    },

    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()')
    }
  });

  // Prevent linking same transaction to same
  // maintenance record twice
  pgm.addConstraint(
    'maintenance_expenses',
    'maintenance_expenses_unique',
    'UNIQUE (maintenance_id, transaction_id)'
  );

  pgm.createIndex('maintenance_expenses', 'maintenance_id');
  pgm.createIndex('maintenance_expenses', 'transaction_id');
};

exports.down = (pgm) => {
  pgm.dropTable('maintenance_expenses');
};