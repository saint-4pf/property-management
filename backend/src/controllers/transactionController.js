const transactionService =
  require('../services/transactionService');

const transactionController = {

  getAll: async (req, res, next) => {
    try {
      const transactions = await transactionService
        .getTransactions(req.query);
      res.json({ success: true, data: transactions });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const transaction = await transactionService
        .getTransactionById(req.params.id);
      res.json({ success: true, data: transaction });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
  try {
    const transaction = await transactionService
      .recordTransaction({
        ...req.body,
        billing_month: req.body.billing_month || null,
        lease_id: req.body.lease_id || null,
        tenant_id: req.body.tenant_id || null,
        unit_id: req.body.unit_id || null,
        block_id: req.body.block_id || null,
        reference_number:
          req.body.reference_number || null,
        description: req.body.description || null
      });
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction recorded successfully'
    });
  } catch (err) { next(err); }
},
  void: async (req, res, next) => {
    try {
      const transaction = await transactionService
        .voidTransaction(
          req.params.id,
          req.body.reason
        );
      res.json({
        success: true,
        data: transaction,
        message: 'Transaction voided'
      });
    } catch (err) { next(err); }
  },

  getBalances: async (req, res, next) => {
    try {
      const balances = await transactionService
        .getAccountBalances();
      res.json({ success: true, data: balances });
    } catch (err) { next(err); }
  },

  getCategoryRules: async (req, res, next) => {
    try {
      const rules = transactionService
        .getCategoryRules();
      res.json({ success: true, data: rules });
    } catch (err) { next(err); }
  }
};

module.exports = transactionController;