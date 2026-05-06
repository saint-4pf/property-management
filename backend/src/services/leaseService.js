const leaseRepo = require('../repositories/leaseRepository');
const unitRepo  = require('../repositories/unitRepository');
const tenantRepo = require('../repositories/tenantRepository');
const transactionRepo =
  require('../repositories/transactionRepository');
const { withTransaction } = require('../config/database');

const leaseService = {

  // Create a new lease — most complex operation
  createLease: async (data) => {
    return await withTransaction(async (client) => {

      // 1. Verify unit exists
      const unit = await unitRepo.findById(data.unit_id);
      if (!unit) {
        throw { status: 404, message: 'Unit not found' };
      }

      // 2. Verify unit is vacant
      if (unit.status !== 'vacant') {
        throw {
          status: 400,
          message: `Unit ${unit.unit_number} is not vacant`
        };
      }

      // 3. Verify tenant exists
      const tenant = await tenantRepo.findById(data.tenant_id);
      if (!tenant) {
        throw { status: 404, message: 'Tenant not found' };
      }

      // 4. Verify tenant has no other active lease
      const existingLease = await leaseRepo
        .findActiveByTenant(data.tenant_id);
      if (existingLease) {
        throw {
          status: 400,
          message: 'Tenant already has an active lease'
        };
      }

      // 5. Validate dates
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (end <= start) {
        throw {
          status: 400,
          message: 'End date must be after start date'
        };
      }

      // 6. Create the lease
      const lease = await leaseRepo.create(data, client);

      // 7. Update unit status to occupied
      await unitRepo.updateStatus(
        data.unit_id, 'occupied', client
      );

      // 8. If deposit provided and paid,
      //    record as a transaction
      if (data.deposit_amount > 0 && data.deposit_paid) {
        await transactionRepo.create({
          transaction_date: data.start_date,
          type: 'income',
          amount: data.deposit_amount,
          account: 'rent',
          category: 'deposit',
          lease_id: lease.id,
          tenant_id: data.tenant_id,
          unit_id: data.unit_id,
          block_id: unit.block_id,
          description: `Security deposit - ${tenant.full_name}`
        }, client);
      }

      return lease;
    });
  },

  // Terminate a lease
  terminateLease: async (lease_id,
    reason = 'Terminated') => {
    return await withTransaction(async (client) => {

      // 1. Get the lease
      const lease = await leaseRepo.findById(lease_id);
      if (!lease) {
        throw { status: 404, message: 'Lease not found' };
      }
      if (lease.status !== 'active') {
        throw {
          status: 400,
          message: 'Lease is not active'
        };
      }

      // 2. Check for outstanding balance
      const rentPaid = await transactionRepo
        .getRentPaidForLease(lease_id);
      const rentOutstanding =
        parseFloat(lease.annual_rent) - rentPaid;

      if (rentOutstanding > 0) {
        throw {
          status: 400,
          message: `Cannot terminate. Outstanding rent ` +
            `balance: KES ${rentOutstanding.toLocaleString()}`
        };
      }

      // 3. Terminate lease
      await leaseRepo.updateStatus(
        lease_id, 'terminated', reason, client
      );

      // 4. Vacate the unit
      await unitRepo.updateStatus(
        lease.unit_id, 'vacant', client
      );

      return { message: 'Lease terminated successfully' };
    });
  },

  // Get complete lease financial summary
  getLeaseSummary: async (lease_id) => {
    const lease = await leaseRepo.findById(lease_id);
    if (!lease) {
      throw { status: 404, message: 'Lease not found' };
    }

    // Rent summary
    const rentPaid = await transactionRepo
      .getRentPaidForLease(lease_id);
    const rentOutstanding =
      parseFloat(lease.annual_rent) - rentPaid;

    // Utility summary — get unpaid months
    const unpaidMonths = await transactionRepo
      .getUnpaidUtilityMonths(
        lease_id,
        lease.start_date,
        lease.end_date
      );

    const monthlyUtility =
      parseFloat(lease.water_monthly) +
      parseFloat(lease.garbage_monthly);

    const utilityOutstanding =
      unpaidMonths.length * monthlyUtility;

    return {
      lease,
      rent: {
        annual_amount: parseFloat(lease.annual_rent),
        total_paid: rentPaid,
        outstanding: rentOutstanding,
        is_fully_paid: rentOutstanding <= 0
      },
      utilities: {
        monthly_amount: monthlyUtility,
        unpaid_months: unpaidMonths,
        outstanding: utilityOutstanding
      },
      total_outstanding:
        rentOutstanding + utilityOutstanding
    };
  },

  getAllLeases: async (filters) => {
    return await leaseRepo.findAll(filters);
  },

  getLeaseById: async (id) => {
    const lease = await leaseRepo.findById(id);
    if (!lease) {
      throw { status: 404, message: 'Lease not found' };
    }
    return lease;
  },

  getExpiringSoon: async (days) => {
    return await leaseRepo.findExpiringSoon(days);
  }
};

module.exports = leaseService;