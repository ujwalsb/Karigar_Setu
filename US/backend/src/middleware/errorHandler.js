'use strict';

/**
 * Global error handler middleware.
 * Catches all errors passed via next(err).
 */
function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.error(err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB.`
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files uploaded at once.'
    });
  }

  // MySQL duplicate entry errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. A record with this value already exists.',
      errors: isProduction ? undefined : [{ message: err.sqlMessage }]
    });
  }

  // MySQL foreign key errors
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please log in again.'
    });
  }

  // Custom app errors with status codes
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? 'Internal server error' : message,
    errors: isProduction ? undefined : (err.errors || undefined),
    stack: isProduction ? undefined : err.stack
  });
}

module.exports = errorHandler;
