const express = require('express');
const request = require('supertest');
const multer = require('multer');
const { errorHandler, createError } = require('../src/middleware/errorHandler');

function appThrowing(err, env) {
  const app = express();
  app.get('/boom', (req, res, next) => next(err));
  app.use((e, req, res, next) => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = env;
    res.on('finish', () => { process.env.NODE_ENV = prev; });
    errorHandler(e, req, res, next);
  });
  return app;
}

describe('errorHandler', () => {
  it('hides internal 5xx messages in production', async () => {
    const res = await request(appThrowing(new Error('connect ECONNREFUSED 10.0.0.5:5432'), 'production')).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.message).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);
    expect(res.body.error.stack).toBeUndefined();
  });

  it('keeps client-facing 4xx messages and details', async () => {
    const res = await request(appThrowing(createError(422, 'Validation failed', [{ field: 'body.email', message: 'Invalid email' }]), 'production')).get('/boom');
    expect(res.status).toBe(422);
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details[0].field).toBe('body.email');
  });

  it('maps multer file-size errors to 413 instead of 500', async () => {
    const res = await request(appThrowing(new multer.MulterError('LIMIT_FILE_SIZE'), 'production')).get('/boom');
    expect(res.status).toBe(413);
  });
});
