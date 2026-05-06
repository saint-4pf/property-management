const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tenantController');

router.get('/',            ctrl.getAll);
router.get('/:id',         ctrl.getById);
router.post('/',           ctrl.create);
router.put('/:id',         ctrl.update);
router.patch('/:id/deactivate', ctrl.deactivate);

module.exports = router;