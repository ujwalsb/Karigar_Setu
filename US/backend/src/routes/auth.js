'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  authController.login
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe);

// PUT /api/v1/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('old_password').notEmpty().withMessage('Old password is required'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
  ],
  handleValidationErrors,
  authController.changePassword
);

// POST /api/v1/auth/setup-admin
router.post(
  '/setup-admin',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
  ],
  handleValidationErrors,
  authController.setupAdmin
);

module.exports = router;
