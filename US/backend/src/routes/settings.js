'use strict';

const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');
const { logoUpload } = require('../config/logoMulter');

// GET /api/v1/settings/public - Public branding & theme info for login screen & public links
router.get('/public', settingsController.getPublicSettings);

router.use(authenticate);

// GET /api/v1/settings - Any authenticated user can read settings (e.g. for theme/branding)
router.get('/', settingsController.getSettings);

// PUT /api/v1/settings - Admin only can update
router.put('/', authorize('admin'), settingsController.updateSettings);

// POST /api/v1/settings/logo - Admin only can upload company logo
router.post(
  '/logo',
  authorize('admin'),
  (req, res, next) => {
    logoUpload.single('logo')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  settingsController.uploadLogo
);

// DELETE /api/v1/settings/logo - Admin only can remove company logo
router.delete('/logo', authorize('admin'), settingsController.deleteLogo);

// POST /api/v1/settings/reset - Admin only can reset to defaults
router.post('/reset', authorize('admin'), settingsController.resetSettings);

module.exports = router;

