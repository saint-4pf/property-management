const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');

router.get('/dashboard',          ctrl.getDashboard);
router.get('/income-vs-expenses', ctrl.getIncomeVsExpenses);

module.exports = router;