'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const customerController = require('../controllers/customerController');

router.use(authenticate);

const normalizeCustomerBody = (req, res, next) => {
  if (!req.body.full_name && req.body.name) req.body.full_name = req.body.name;
  if (!req.body.pin_code && req.body.pinCode) req.body.pin_code = req.body.pinCode;
  if (!req.body.alternate_mobile && (req.body.alternateMobile || req.body.alt_mobile)) {
    req.body.alternate_mobile = req.body.alternateMobile || req.body.alt_mobile;
  }
  if (req.body.mobile && typeof req.body.mobile === 'string') {
    req.body.mobile = req.body.mobile.replace(/[\s\-\(\)]/g, '');
  }
  next();
};

// GET /api/v1/customers/lookup
router.get('/lookup', customerController.lookupCustomer);

// GET /api/v1/customers/by-mobile/:mobile
router.get('/by-mobile/:mobile', customerController.lookupCustomer);

// GET /api/v1/customers/search
router.get('/search', customerController.searchCustomers);

// GET /api/v1/customers
router.get('/', customerController.getAllCustomers);

// POST /api/v1/customers
router.post(
  '/',
  normalizeCustomerBody,
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('mobile')
      .trim()
      .notEmpty()
      .withMessage('Mobile number is required')
      .isLength({ min: 10, max: 15 })
      .withMessage('Invalid mobile number'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
    body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 })
  ],
  handleValidationErrors,
  customerController.createCustomer
);

// GET /api/v1/customers/:id
router.get('/:id', customerController.getCustomerById);

// PUT /api/v1/customers/:id (Admin and Support)
router.put(
  '/:id',
  authorize('admin', 'support'),
  normalizeCustomerBody,
  customerController.updateCustomer
);

// DELETE /api/v1/customers/:id (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  customerController.deleteCustomer
);

// GET /api/v1/customers/:id/calls
router.get('/:id/calls', customerController.getCustomerCalls);

// GET /api/v1/customers/:id/service-details
router.get('/:id/service-details', customerController.getCustomerServiceDetails);
router.get('/:id/history', customerController.getCustomerServiceDetails);

module.exports = router;
