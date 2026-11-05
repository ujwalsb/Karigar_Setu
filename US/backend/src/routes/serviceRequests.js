'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const serviceRequestController = require('../controllers/serviceRequestController');

router.use(authenticate);

// GET /api/v1/service-requests
router.get('/', serviceRequestController.getAllRequests);

// GET /api/v1/service-requests/:id
router.get('/:id', serviceRequestController.getRequestById);

// PUT /api/v1/service-requests/:id
router.put('/:id', serviceRequestController.updateRequest);

// PATCH /api/v1/service-requests/:id/status
router.patch(
  '/:id/status',
  [body('status').notEmpty().withMessage('Status is required')],
  handleValidationErrors,
  serviceRequestController.updateStatus
);

// POST /api/v1/service-requests/:id/complete
router.post('/:id/complete', serviceRequestController.completeRequest);

// GET /api/v1/service-requests/:id/history
router.get('/:id/history', serviceRequestController.getStatusHistory);

// GET /api/v1/service-requests/:id/dispatch
router.get('/:id/dispatch', serviceRequestController.getDispatchDetails);

// GET /api/v1/service-requests/:id/submission-link
router.get('/:id/submission-link', serviceRequestController.getSubmissionLink);

const normalizeAssignment = (req, res, next) => {
  if (!req.body.technician_id && req.body.technicianId) {
    req.body.technician_id = req.body.technicianId;
  }
  if (!req.body.technicianId && req.body.technician_id) {
    req.body.technicianId = req.body.technician_id;
  }
  if (typeof req.body.technician_id === 'string' && req.body.technician_id) {
    req.body.technician_id = parseInt(req.body.technician_id, 10);
  }
  if (typeof req.body.technicianId === 'string' && req.body.technicianId) {
    req.body.technicianId = parseInt(req.body.technicianId, 10);
  }
  next();
};

// POST /api/v1/service-requests/:id/assign
router.post(
  '/:id/assign',
  normalizeAssignment,
  [body('technician_id').isInt({ min: 1 }).withMessage('Valid technician_id required')],
  handleValidationErrors,
  serviceRequestController.assignTechnician
);

// POST /api/v1/service-requests/:id/reassign
router.post(
  '/:id/reassign',
  normalizeAssignment,
  [body('technician_id').isInt({ min: 1 }).withMessage('Valid technician_id required')],
  handleValidationErrors,
  serviceRequestController.reassignTechnician
);

// PATCH /api/v1/service-requests/assignment/:assignmentId
router.patch('/assignment/:assignmentId', serviceRequestController.updateAssignment);

module.exports = router;
