const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.plan, u.created_at, u.last_login_at,
            COUNT(DISTINCT j.id) as total_jobs,
            COUNT(DISTINCT ak.id) FILTER (WHERE ak.is_active) as active_api_keys
     FROM users u
     LEFT JOIN audio_jobs j ON j.user_id = u.id
     LEFT JOIN api_keys ak ON ak.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.user.id]
  );
  res.json({ success: true, data: rows[0] });
});

router.patch('/me', authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name || name.length < 2) throw createError(422, 'Name must be at least 2 characters');
  const { rows } = await pool.query(
    'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, plan',
    [name, req.user.id]
  );
  res.json({ success: true, data: rows[0] });
});

router.patch('/me/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) throw createError(422, 'Password must be at least 8 characters');
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0].password_hash) throw createError(400, 'Account uses social login');
  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw createError(401, 'Current password is incorrect');
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
  res.json({ success: true, message: 'Password updated' });
});

router.get('/usage', authenticate, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `SELECT DATE(created_at) as date, COUNT(*) as jobs
     FROM audio_jobs
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [req.user.id]
  );
  res.json({ success: true, data: { dailyUsage: rows, today } });
});

module.exports = router;
