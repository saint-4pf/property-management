const transactionRepo =
  require('../repositories/transactionRepository');
const leaseRepo =
  require('../repositories/leaseRepository');

// Category → Account mapping rules
// This enforces financial consistency
const CATEGORY_ACCOUNT_MAP = {
  rent:            'rent',
  deposit:         'rent',
  utility_water:   'utility',
  utility_garbage: 'utility',
  diesel:          'imprest',
  repairs:         'imprest',
  salaries:        'imprest',
  transport:       'imprest',
  materials:       'imprest',
  other_expense:   'imprest',
  other_income:    'imprest'
};

const transactionService = {

  recordTransaction: async (data) => {

    // Rule 1: category must match account
    const expectedAccount =
      CATEGORY_ACCOUNT_MAP[data.category];

    if (expectedAccount &&
        expectedAccount !== data.account) {
      throw {
        status: 400,
        message:
          `Category "${data.category}" must use ` +
          `the "${expectedAccount}" account, ` +
          `not "${data.account}"`
      };
    }

    // Rule 2: utility payments need billing_month
    if (
      ['utility_water', 'utility_garbage']
        .includes(data.category) &&
      !data.billing_month
    ) {
      throw {
        status: 400,
        message:
          'Utility payments require billing_month ' +
          'in format YYYY-MM e.g. 2025-03'
      };
    }

    // Rule 3: rent payment needs valid active lease
    if (data.category === 'rent' && data.lease_id) {
      const lease = await leaseRepo
        .findById(data.lease_id);
      if (!lease) {
        throw { status: 404,
          message: 'Lease not found' };
      }
      if (lease.status !== 'active') {
        throw {
          status: 400,
          message: 'Cannot record payment ' +
            'against an inactive lease'
        };
      }
    }

    // All rules passed — record it
    return await transactionRepo.create(data);
  },

  getTransactions: async (filters) => {
    return await transactionRepo.findAll(filters);
  },

  getTransactionById: async (id) => {
    const transaction = await transactionRepo
      .findById(id);
    if (!transaction) {
      throw { status: 404,
        message: 'Transaction not found' };
    }
    return transaction;
  },

  voidTransaction: async (id, reason) => {
    const transaction = await transactionRepo
      .findById(id);
    if (!transaction) {
      throw { status: 404,
        message: 'Transaction not found' };
    }
    if (transaction.is_voided) {
      throw { status: 400,
        message: 'Transaction is already voided' };
    }
    if (!reason || reason.trim() === '') {
      throw {
        status: 400,
        message: 'A reason is required ' +
          'to void a transaction'
      };
    }
    return await transactionRepo.void(id, reason);
  },

  getAccountBalances: async () => {
    const balances = await transactionRepo
      .getAllAccountBalances();

    // Always return all 3 accounts
    // even if they have zero transactions
    const accounts = ['rent', 'utility', 'imprest'];
    const result = accounts.map(account => {
      const found = balances.find(
        b => b.account === account
      );
      return found || {
        account,
        total_income:   '0',
        total_expenses: '0',
        balance:        '0'
      };
    });

    // Overall totals across all accounts
    const totals = result.reduce((acc, b) => ({
      total_income:
        acc.total_income + parseFloat(b.total_income),
      total_expenses:
        acc.total_expenses +
        parseFloat(b.total_expenses),
      net_balance:
        acc.net_balance + parseFloat(b.balance)
    }), {
      total_income:   0,
      total_expenses: 0,
      net_balance:    0
    });

    return { accounts: result, totals };
  },

  getCategoryRules: () => {
    return CATEGORY_ACCOUNT_MAP;
  }
};

module.exports = transactionService;