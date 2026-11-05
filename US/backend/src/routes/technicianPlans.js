'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const technicianPlanController = require('../controllers/technicianPlanController');

// All technician plan management routes require Admin authorization
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/v1/technician-plans - Fetch all technician plans and summary KPIs
router.get('/', technicianPlanController.getAllTechnicianPlans);

// PUT /api/v1/technician-plans/:id - Update plan type (commission/monthly) & rates
router.put('/:id', technicianPlanController.updateTechnicianPlan);

// POST /api/v1/technician-plans/:id/payment - Record payment (commission collection or monthly subscription renewal)
router.post('/:id/payment', technicianPlanController.recordTechnicianPayment);

// GET /api/v1/technician-plans/:id/ledger - Fetch transaction history ledger for technician
router.get('/:id/ledger', technicianPlanController.getTechnicianLedger);

module.exports = router;
