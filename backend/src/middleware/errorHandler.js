const logger = require('../utils/logger');

function createError(status, message, details = null) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

// multer throws these without an HTTP status; without this map they surface
// as a 500 with the library's raw message.
const MULTER_STATUS = {
  LIMIT_FILE_SIZE: [413, 'File is too large for your plan'],
  LIMIT_FILE_COUNT: [413, 'Too many files in one request'],
  LIMIT_UNEXPECTED_FILE: [400, 'Unexpected file field — send the audio as the "audio" field'],
  LIMIT_PART_COUNT: [400, 'Too many parts in the upload'],
  LIMIT_FIELD_KEY: [400, 'A form field name is too long'],
  LIMIT_FIELD_VALUE: [400, 'A form field value is too long'],
  LIMIT_FIELD_COUNT: [400, 'Too many form fields'],
};

function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError' && MULTER_STATUS[err.code]) {
    [status, message] = MULTER_STATUS[err.code];
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  }

  if (status >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    // Internal messages (database errors, upstream failures, file paths) are
    // for the log, not the client.
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong on our side. Please try again.';
    }
  }

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(err.details && status < 500 && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
}

module.exports = { errorHandler, notFound, createError };
