'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const serviceCategoryController = require('../controllers/serviceCategoryController');

router.use(authenticate);

// GET /api/v1/service-categories
router.get('/', serviceCategoryController.getAll);

// POST /api/v1/service-categories — admin only
router.post(
  '/',
  authorize('admin'),
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  handleValidationErrors,
  serviceCategoryController.create
);

// PUT /api/v1/service-categories/:id — admin only
router.put('/:id', authorize('admin'), serviceCategoryController.update);

// PATCH /api/v1/service-categories/:id/toggle — admin only
router.patch('/:id/toggle', authorize('admin'), serviceCategoryController.toggle);

module.exports = router;
