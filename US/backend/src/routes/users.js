'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const userController = require('../controllers/userController');

router.use(authenticate, authorize('admin'));

// GET /api/v1/users
router.get('/', userController.getAllUsers);

// POST /api/v1/users
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'support']).withMessage('Role must be admin or support'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone')
  ],
  handleValidationErrors,
  userController.createUser
);

// PUT /api/v1/users/:id
router.put('/:id', userController.updateUser);

// DELETE /api/v1/users/:id
router.delete('/:id', userController.deleteUser);

// PATCH /api/v1/users/:id/toggle
router.patch('/:id/toggle', userController.toggleUserActive);

// PATCH /api/v1/users/:id/deactivate
router.patch('/:id/deactivate', userController.deactivateUser);

// GET /api/v1/users/:id/activity
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;
