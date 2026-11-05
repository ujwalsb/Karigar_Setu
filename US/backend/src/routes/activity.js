'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// All activity routes require admin authentication
router.use(authenticate, authorize('admin'));

// GET /api/v1/activity/stats
router.get('/stats', activityController.getActivityStats);

// GET /api/v1/activity
router.get('/', activityController.getActivityLogs);

// GET /api/v1/activity/user/:id
router.get('/user/:id', activityController.getUserActivities);

// POST /api/v1/activity/clear (or DELETE /)
router.post('/clear', activityController.clearOldLogs);
router.delete('/', activityController.clearOldLogs);

module.exports = router;
