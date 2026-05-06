const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/leaseController');

// Order matters — specific routes before param routes
router.get('/expiring-soon',       ctrl.getExpiringSoon);
router.get('/',                    ctrl.getAll);
router.get('/:id',                 ctrl.getById);
router.get('/:id/summary',         ctrl.getSummary);
router.get('/:id/transactions',    ctrl.getTransactions);
router.get('/:id/utility-status',  ctrl.getUtilityStatus);
router.post('/',                   ctrl.create);
router.patch('/:id/terminate',     ctrl.terminate);

module.exports = router;