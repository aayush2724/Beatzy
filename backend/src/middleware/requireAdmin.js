/**
 * Admin guard middleware — restricts a route to users with `is_admin = true`.
 */
const { pool } = require('../db/client');
const { createError } = require('./errorHandler');

async function requireAdmin(req, res, next) {
  if (!req.user) return next(createError(401, 'Authentication required'));

  try {
    const { rows } = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id],
    );
    if (!rows[0] || !rows[0].is_admin) {
      return next(createError(403, 'Admin access required'));
    }
    next();
  } catch (err) {
    next(createError(500, 'Failed to verify admin status'));
  }
}

module.exports = { requireAdmin };
