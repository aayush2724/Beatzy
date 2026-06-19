const logger = require('../utils/logger');

function createError(status, message, details = null) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
}

module.exports = { errorHandler, notFound, createError };
