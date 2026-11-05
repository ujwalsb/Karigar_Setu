'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const callController = require('../controllers/callController');

router.use(authenticate);

// GET /api/v1/calls/recent
router.get('/recent', callController.getRecentCalls);

// GET /api/v1/calls
router.get('/', callController.getAllCalls);

// POST /api/v1/calls
router.post(
  '/',
  (req, res, next) => {
    if (!req.body.customer_id && req.body.customerId) req.body.customer_id = req.body.customerId;
    if (!req.body.service_category_id && req.body.serviceCategoryId) req.body.service_category_id = req.body.serviceCategoryId;
    if (!req.body.requirement && req.body.specificRequirement) req.body.requirement = req.body.specificRequirement;
    if (!req.body.problem_description && req.body.problemDescription) req.body.problem_description = req.body.problemDescription;
    if (!req.body.call_source && req.body.callSource) req.body.call_source = req.body.callSource;
    if (!req.body.preferred_date && req.body.preferredDate) req.body.preferred_date = req.body.preferredDate;
    if (!req.body.preferred_time && req.body.preferredTime) req.body.preferred_time = req.body.preferredTime;
    if (typeof req.body.customer_id === 'string') {
      req.body.customer_id = parseInt(req.body.customer_id, 10);
    }
    if (typeof req.body.service_category_id === 'string' && req.body.service_category_id) {
      req.body.service_category_id = parseInt(req.body.service_category_id, 10);
    }
    next();
  },
  [
    body('customer_id').isInt({ min: 1 }).withMessage('Valid customer_id required'),
    body('urgency').optional().isIn(['normal', 'urgent', 'emergency']),
    body('call_source').optional().isIn(['phone', 'whatsapp', 'walk_in', 'reference', 'online', 'referral', 'other']),
    body('preferred_date').optional({ checkFalsy: true }),
    body('preferred_time').optional({ checkFalsy: true })
  ],
  handleValidationErrors,
  callController.createCall
);

// GET /api/v1/calls/:id
router.get('/:id', callController.getCallById);

// PUT /api/v1/calls/:id
router.put('/:id', callController.updateCall);

// PATCH /api/v1/calls/:id/status
router.patch(
  '/:id/status',
  [body('status').notEmpty().withMessage('Status is required')],
  handleValidationErrors,
  callController.updateCallStatus
);

// POST /api/v1/calls/:id/assign
router.post(
  '/:id/assign',
  (req, res, next) => {
    if (!req.body.technician_id && req.body.technicianId) req.body.technician_id = req.body.technicianId;
    if (!req.body.technicianId && req.body.technician_id) req.body.technicianId = req.body.technician_id;
    if (typeof req.body.technician_id === 'string' && req.body.technician_id) {
      req.body.technician_id = parseInt(req.body.technician_id, 10);
    }
    if (typeof req.body.technicianId === 'string' && req.body.technicianId) {
      req.body.technicianId = parseInt(req.body.technicianId, 10);
    }
    next();
  },
  [body('technician_id').isInt({ min: 1 }).withMessage('Valid technician_id required')],
  handleValidationErrors,
  callController.assignTechnician
);

// GET /api/v1/calls/:id/notes
router.get('/:id/notes', callController.getNotes);

// POST /api/v1/calls/:id/notes
router.post(
  '/:id/notes',
  [body('note').trim().notEmpty().withMessage('Note content is required')],
  handleValidationErrors,
  callController.addNote
);

module.exports = router;
