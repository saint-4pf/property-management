const tenantRepo = 
  require('../repositories/tenantRepository');

const tenantController = {

  getAll: async (req, res, next) => {
    try {
      const tenants = await tenantRepo
        .findAll(req.query);
      res.json({ success: true, data: tenants });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const tenant = await tenantRepo
        .findById(req.params.id);
      if (!tenant) return res.status(404).json({
        success: false, error: 'Tenant not found'
      });
      res.json({ success: true, data: tenant });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      const tenant = await tenantRepo
        .create(req.body);
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully'
      });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const tenant = await tenantRepo
        .update(req.params.id, req.body);
      if (!tenant) return res.status(404).json({
        success: false, error: 'Tenant not found'
      });
      res.json({ success: true, data: tenant });
    } catch (err) { next(err); }
  },

  deactivate: async (req, res, next) => {
    try {
      const tenant = await tenantRepo.update(
        req.params.id, { status: 'inactive' }
      );
      res.json({
        success: true,
        message: 'Tenant deactivated',
        data: tenant
      });
    } catch (err) { next(err); }
  }
};

module.exports = tenantController;