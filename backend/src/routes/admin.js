/**
 * Admin API router — protected by `authenticate` + `requireAdmin`.
 *
 * Endpoints:
 *   GET  /api/admin/users          — paginated user list
 *   GET  /api/admin/users/:id      — single user detail
 *   PATCH /api/admin/users/:id     — toggle is_active / plan / is_admin
 *   GET  /api/admin/stats          — platform‑wide KPIs
 *   GET  /api/admin/audit-log      — paginated audit log
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { pool } = require('../db/client');
const { logAudit } = require('../services/audit');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

// Every admin route requires auth + admin
router.use(authenticate, requireAdmin);

// ── Users list ──────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 25);
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.plan, u.is_active, u.is_admin,
            u.created_at, u.last_login_at,
            COUNT(DISTINCT j.id)::int AS total_jobs
     FROM users u
     LEFT JOIN audio_jobs j ON j.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS total FROM users');

  res.json({
    success: true,
    data: {
      users: rows,
      pagination: { page, limit, total: countRows[0].total, pages: Math.ceil(countRows[0].total / limit) },
    },
  });
});

// ── Single user detail ──────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.*, COUNT(DISTINCT j.id)::int AS total_jobs
     FROM users u
     LEFT JOIN audio_jobs j ON j.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.params.id],
  );
  if (!rows[0]) throw createError(404, 'User not found');
  res.json({ success: true, data: rows[0] });
});

// ── Update user flags ───────────────────────────────────────────────────────
router.patch('/users/:id', async (req, res) => {
  // Prevent admins from locking themselves out or deactivating their own account
  if (req.params.id === req.user.id) {
    if (typeof req.body.is_admin === 'boolean' && req.body.is_admin === false) {
      throw createError(403, 'Cannot revoke your own admin privileges');
    }
    if (typeof req.body.is_active === 'boolean' && req.body.is_active === false) {
      throw createError(403, 'Cannot deactivate your own account');
    }
  }

  const { is_active, plan, is_admin } = req.body;
  const sets = [];
  const vals = [];
  let idx = 1;

  if (typeof is_active === 'boolean') { sets.push(`is_active = $${idx++}`); vals.push(is_active); }
  if (['free', 'pro', 'enterprise'].includes(plan)) { sets.push(`plan = $${idx++}`); vals.push(plan); }
  if (typeof is_admin === 'boolean') { sets.push(`is_admin = $${idx++}`); vals.push(is_admin); }

  if (sets.length === 0) throw createError(422, 'No valid fields to update');

  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);

  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, name, email, plan, is_active, is_admin`,
    vals,
  );
  if (!rows[0]) throw createError(404, 'User not found');

  await logAudit({
    userId: req.user.id,
    action: 'admin.update_user',
    meta: { targetUser: req.params.id, changes: req.body },
    ip: req.ip,
  });

  res.json({ success: true, data: rows[0] });
});

// ── Platform stats ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const [users, jobs, plans] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM users'),
    pool.query(`SELECT status, COUNT(*)::int AS count FROM audio_jobs GROUP BY status`),
    pool.query(`SELECT plan, COUNT(*)::int AS count FROM users GROUP BY plan`),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: users.rows[0].total,
      jobsByStatus: Object.fromEntries(jobs.rows.map((r) => [r.status, r.count])),
      usersByPlan: Object.fromEntries(plans.rows.map((r) => [r.plan, r.count])),
    },
  });
});

// ── Audit log ───────────────────────────────────────────────────────────────
router.get('/audit-log', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT a.id, a.user_id, u.email, a.action, a.metadata, a.ip_address, a.created_at
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS total FROM audit_logs');

  res.json({
    success: true,
    data: {
      logs: rows,
      pagination: { page, limit, total: countRows[0].total, pages: Math.ceil(countRows[0].total / limit) },
    },
  });
});

module.exports = router;