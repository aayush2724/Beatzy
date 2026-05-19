const jwt = require('jsonwebtoken');
const { pool } = require('../db/client');
const { createError } = require('./errorHandler');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createError(401, 'No token provided'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, email, name, plan, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!rows[0] || !rows[0].is_active) {
      return next(createError(401, 'User not found or deactivated'));
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return next(createError(401, 'Invalid or expired token'));
  }
}

async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return authenticate(req, res, next);

  const { rows } = await pool.query(
    `SELECT ak.id, ak.user_id, ak.name, u.id as uid, u.email, u.plan, u.is_active
     FROM api_keys ak
     JOIN users u ON u.id = ak.user_id
     WHERE ak.key_hash = crypt($1, ak.key_hash) AND ak.is_active = true`,
    [apiKey]
  );
  if (!rows[0] || !rows[0].is_active) {
    return next(createError(401, 'Invalid API key'));
  }
  await pool.query(
    'UPDATE api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1',
    [rows[0].id]
  );
  req.user = { id: rows[0].uid, email: rows[0].email, plan: rows[0].plan, is_active: true };
  req.apiKey = { id: rows[0].id, name: rows[0].name };
  next();
}

function requirePlan(...plans) {
  return (req, res, next) => {
    if (!plans.includes(req.user.plan)) {
      return next(createError(403, `This feature requires one of: ${plans.join(', ')} plan`));
    }
    next();
  };
}

module.exports = { authenticate, authenticateApiKey, requirePlan };
