const blockRepo = 
  require('../repositories/blockRepository');

const blockController = {

  getAll: async (req, res, next) => {
    try {
      const blocks = await blockRepo.findAll();
      res.json({ success: true, data: blocks });
    } catch (err) { next(err); }
  },

  getById: async (req, res, next) => {
    try {
      const block = await blockRepo
        .findById(req.params.id);
      if (!block) return res.status(404).json({
        success: false, error: 'Block not found'
      });
      res.json({ success: true, data: block });
    } catch (err) { next(err); }
  },

  create: async (req, res, next) => {
    try {
      // Check duplicate name
      const existing = await blockRepo
        .findByName(req.body.name);
      if (existing) return res.status(400).json({
        success: false,
        error: `Block "${req.body.name}" already exists`
      });
      const block = await blockRepo.create(req.body);
      res.status(201).json({
        success: true,
        data: block,
        message: 'Block created successfully'
      });
    } catch (err) { next(err); }
  },

  update: async (req, res, next) => {
    try {
      const block = await blockRepo
        .update(req.params.id, req.body);
      if (!block) return res.status(404).json({
        success: false, error: 'Block not found'
      });
      res.json({ success: true, data: block });
    } catch (err) { next(err); }
  },

  softDelete: async (req, res, next) => {
    try {
      await blockRepo.softDelete(req.params.id);
      res.json({
        success: true,
        message: 'Block deactivated successfully'
      });
    } catch (err) { next(err); }
  }
};

module.exports = blockController;