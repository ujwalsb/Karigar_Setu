'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(authenticate);

// GET /api/v1/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboard);

// GET /api/v1/analytics/support-dashboard
router.get('/support-dashboard', analyticsController.getDashboard);

// GET /api/v1/analytics/calls-over-time
router.get('/calls-over-time', analyticsController.getCallsChart);

// GET /api/v1/analytics/category-breakdown
router.get('/category-breakdown', analyticsController.getCategoryBreakdown);

// GET /api/v1/analytics/area-wise-demand
router.get('/area-wise-demand', analyticsController.getAreaDemand);

// GET /api/v1/analytics/employee-performance (admin only)
router.get('/employee-performance', authorize('admin'), analyticsController.getEmployeePerformance);

// GET /api/v1/analytics/technician-performance (admin only)
router.get('/technician-performance', authorize('admin'), analyticsController.getTechnicianPerformance);

// GET /api/v1/analytics/export (admin only)
router.get('/export', authorize('admin'), analyticsController.exportReport);

module.exports = router;

