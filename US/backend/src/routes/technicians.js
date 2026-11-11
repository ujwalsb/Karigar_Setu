'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const multerUpload = require('../config/multer');
const technicianController = require('../controllers/technicianController');
const documentController = require('../controllers/documentController');

router.use(authenticate);

// GET /api/v1/technicians/nearest and /api/v1/technicians/find
router.get('/nearest', technicianController.findNearestTechnicians);
router.get('/find', technicianController.findNearestTechnicians);

const normalizeTechnicianBody = (req, res, next) => {
  if (!req.body.full_name && req.body.name) req.body.full_name = req.body.name;
  if (!req.body.pin_code && req.body.pinCode) req.body.pin_code = req.body.pinCode;
  if (!req.body.area && req.body.primary_area) req.body.area = req.body.primary_area;
  if (!req.body.alternate_mobile && (req.body.alternateMobile || req.body.alt_mobile)) {
    req.body.alternate_mobile = req.body.alternateMobile || req.body.alt_mobile;
  }
  if (req.body.badge_code === undefined && req.body.badgeCode !== undefined) {
    req.body.badge_code = req.body.badgeCode;
  }
  if (req.body.id_card_valid_until === undefined && req.body.idCardValidUntil !== undefined) {
    req.body.id_card_valid_until = req.body.idCardValidUntil;
  }
  if (req.body.blood_group === undefined && req.body.bloodGroup !== undefined) {
    req.body.blood_group = req.body.bloodGroup;
  }
  if (req.body.id_card_theme === undefined && req.body.idCardTheme !== undefined) {
    req.body.id_card_theme = req.body.idCardTheme;
  }
  if (req.body.mobile && typeof req.body.mobile === 'string') {
    req.body.mobile = req.body.mobile.replace(/[\s\-\(\)]/g, '');
  }
  if (req.body.availability === 'unavailable') {
    req.body.availability = 'offline';
  }
  next();
};

// GET /api/v1/technicians
router.get('/', technicianController.getAllTechnicians);

// POST /api/v1/technicians (Admin only)
router.post(
  '/',
  authorize('admin'),
  normalizeTechnicianBody,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('mobile')
      .trim()
      .notEmpty()
      .withMessage('Mobile is required')
      .isLength({ min: 10, max: 15 })
      .withMessage('Invalid mobile number'),
    body('experience_years').optional().isInt({ min: 0 }),
    body('availability').optional().isIn(['available', 'busy', 'offline', 'unavailable']),
    body('skills').optional().isArray(),
    body('service_areas').optional().isArray()
  ],
  handleValidationErrors,
  technicianController.createTechnician
);

// GET /api/v1/technicians/:id
router.get('/:id', technicianController.getTechnicianById);

// PUT /api/v1/technicians/:id (Admin only)
router.put(
  '/:id',
  authorize('admin'),
  normalizeTechnicianBody,
  technicianController.updateTechnician
);

// DELETE /api/v1/technicians/:id (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  technicianController.deleteTechnician
);

// GET /api/v1/technicians/:id/history
router.get('/:id/history', technicianController.getTechnicianHistory);

// GET /api/v1/technicians/:id/documents
router.get('/:technician_id/documents', documentController.getDocuments);

// POST /api/v1/technicians/:technicianId/documents
router.post(
  '/:technicianId/documents',
  (req, res, next) => {
    multerUpload.any()(req, res, (err) => {
      if (err) return next(err);
      if (req.files && req.files.length > 0) req.file = req.files[0];
      next();
    });
  },
  documentController.uploadDocument
);

// PATCH /api/v1/technicians/:id/verify — admin only
router.patch(
  '/:id/verify',
  authorize('admin'),
  [body('status').isIn(['pending', 'verified', 'rejected']).withMessage('Invalid verification status')],
  handleValidationErrors,
  technicianController.updateVerificationStatus
);

module.exports = router;
