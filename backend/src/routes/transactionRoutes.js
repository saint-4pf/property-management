const express = require('express');
const router = express.Router();
const ctrl =
  require('../controllers/transactionController');

router.get('/',          ctrl.getAll);
router.get('/balances',  ctrl.getBalances);
router.get('/categories', ctrl.getCategoryRules);
router.get('/:id',       ctrl.getById);
router.post('/',         ctrl.create);
router.patch('/:id/void', ctrl.void);

module.exports = router;