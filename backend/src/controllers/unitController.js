const unitRepo = 
  require('../repositories/unitRepository');

const unitController = {

  getAll: async (req, res, next) => {
    try {
      const units = await unitRepo.findAll(req.query);
      res.json({ success: true, data: units });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const unit = await unitRepo
        .findById(req.params.id);
      if (!unit) return res.status(404).json({
        success: false, error: 'Unit not found'
      });
      res.json({ success: true, data: unit });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      // Check duplicate unit in same block
      const existing = await unitRepo
        .findByBlockAndNumber(
          req.body.block_id,
          req.body.unit_number
        );
      if (existing) return res.status(400).json({
        success: false,
        error: `Unit ${req.body.unit_number} already` +
          ` exists in this block`
      });
      const unit = await unitRepo.create(req.body);
      res.status(201).json({
        success: true,
        data: unit,
        message: 'Unit created successfully'
      });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const unit = await unitRepo
        .update(req.params.id, req.body);
      if (!unit) return res.status(404).json({
        success: false, error: 'Unit not found'
      });
      res.json({ success: true, data: unit });
    } catch (err) { next(err); }
  },

  softDelete: async (req, res, next) => {
    try {
      await unitRepo.softDelete(req.params.id);
      res.json({
        success: true,
        message: 'Unit deactivated successfully'
      });
    } catch (err) { next(err); }
  }
};

module.exports = unitController;