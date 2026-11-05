'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

router.use(authenticate);

// GET /api/v1/settings - Any authenticated user can read settings (e.g. for theme/branding)
router.get('/', settingsController.getSettings);

// PUT /api/v1/settings - Admin only can update
router.put('/', authorize('admin'), settingsController.updateSettings);

// POST /api/v1/settings/reset - Admin only can reset to defaults
router.post('/reset', authorize('admin'), settingsController.resetSettings);

module.exports = router;

