'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator errors.
 * Returns 400 with an array of validation errors if any exist.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
}

module.exports = { handleValidationErrors };
