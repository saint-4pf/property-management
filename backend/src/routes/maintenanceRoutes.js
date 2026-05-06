const express = require('express');
const router = express.Router();
const ctrl =
  require('../controllers/maintenanceController');

router.get('/',                  ctrl.getAll);
router.get('/:id',               ctrl.getById);
router.post('/',                 ctrl.create);
router.put('/:id',               ctrl.update);
router.post('/:id/link-expense', ctrl.linkExpense);

module.exports = router;