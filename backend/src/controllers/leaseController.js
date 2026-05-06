const leaseService = require('../services/leaseService');
const transactionRepo =
  require('../repositories/transactionRepository');

const leaseController = {

  // GET /api/leases
  getAll: async (req, res, next) => {
    try {
      const leases = await leaseService
        .getAllLeases(req.query);
      res.json({ success: true, data: leases });
    } catch (err) { next(err); }
  },

  // GET /api/leases/expiring-soon
  getExpiringSoon: async (req, res, next) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const leases = await leaseService
        .getExpiringSoon(days);
      res.json({
        success: true,
        data: leases,
        message: `Leases expiring within ${days} days`
      });
    } catch (err) { next(err); }
  },

  // GET /api/leases/:id
  getById: async (req, res, next) => {
    try {
      const lease = await leaseService
        .getLeaseById(req.params.id);
      res.json({ success: true, data: lease });
    } catch (err) { next(err); }
  },

  // GET /api/leases/:id/summary
  // Full financial summary for a lease
  getSummary: async (req, res, next) => {
    try {
      const summary = await leaseService
        .getLeaseSummary(req.params.id);
      res.json({ success: true, data: summary });
    } catch (err) { next(err); }
  },

  // POST /api/leases
  create: async (req, res, next) => {
    try {
      const lease = await leaseService
        .createLease(req.body);
      res.status(201).json({
        success: true,
        data: lease,
        message: 'Lease created successfully'
      });
    } catch (err) { next(err); }
  },

  // PATCH /api/leases/:id/terminate
  terminate: async (req, res, next) => {
    try {
      if (!req.body.reason) {
        return res.status(400).json({
          success: false,
          error: 'A termination reason is required'
        });
      }
      const result = await leaseService
        .terminateLease(
          req.params.id,
          req.body.reason
        );
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  },

  // GET /api/leases/:id/transactions
  // All transactions for a specific lease
  getTransactions: async (req, res, next) => {
    try {
      const transactions = await transactionRepo
        .findAll({ lease_id: req.params.id });
      res.json({ success: true, data: transactions });
    } catch (err) { next(err); }
  },

  // GET /api/leases/:id/utility-status
  // Which months have been paid for utilities
  getUtilityStatus: async (req, res, next) => {
    try {
      const lease = await leaseService
        .getLeaseById(req.params.id);

      const unpaidMonths = await transactionRepo
        .getUnpaidUtilityMonths(
          req.params.id,
          lease.start_date,
          lease.end_date
        );

      const monthlyDue =
        parseFloat(lease.water_monthly) +
        parseFloat(lease.garbage_monthly);

      res.json({
        success: true,
        data: {
          lease_id:      req.params.id,
          water_monthly: lease.water_monthly,
          garbage_monthly: lease.garbage_monthly,
          monthly_total: monthlyDue,
          unpaid_months: unpaidMonths,
          unpaid_count:  unpaidMonths.length,
          total_outstanding:
            unpaidMonths.length * monthlyDue
        }
      });
    } catch (err) { next(err); }
  }
};

module.exports = leaseController;