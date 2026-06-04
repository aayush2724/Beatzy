const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/favorites', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT j.id, j.status, j.created_at, r.song_title, r.song_artist, r.bpm, r.mood, r.spotify_features
     FROM job_favorites f
     JOIN audio_jobs j ON j.id = f.job_id
     LEFT JOIN analysis_results r ON r.job_id = j.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.id],
  );
  res.json({ success: true, data: rows });
});

router.post('/favorites/:jobId', authenticate, async (req, res) => {
  const { rows: job } = await pool.query(
    'SELECT id FROM audio_jobs WHERE id = $1 AND user_id = $2',
    [req.params.jobId, req.user.id],
  );
  if (!job[0]) throw createError(404, 'Job not found');

  await pool.query(
    `INSERT INTO job_favorites (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.user.id, req.params.jobId],
  );
  res.json({ success: true, message: 'Added to favorites' });
});

router.delete('/favorites/:jobId', authenticate, async (req, res) => {
  await pool.query('DELETE FROM job_favorites WHERE user_id = $1 AND job_id = $2', [req.user.id, req.params.jobId]);
  res.json({ success: true, message: 'Removed from favorites' });
});

router.get('/collections', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, COUNT(ci.job_id)::int AS item_count
     FROM collections c
     LEFT JOIN collection_items ci ON ci.collection_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
    [req.user.id],
  );
  res.json({ success: true, data: rows });
});

router.post('/collections', authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) throw createError(400, 'Collection name required');
  const { rows } = await pool.query(
    `INSERT INTO collections (id, user_id, name) VALUES ($1, $2, $3) RETURNING *`,
    [uuidv4(), req.user.id, name.trim()],
  );
  res.status(201).json({ success: true, data: rows[0] });
});

router.post('/collections/:id/items', authenticate, async (req, res) => {
  const { jobId } = req.body;
  if (!jobId) throw createError(400, 'jobId required');

  const { rows: col } = await pool.query(
    'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id],
  );
  if (!col[0]) throw createError(404, 'Collection not found');

  await pool.query(
    `INSERT INTO collection_items (collection_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.params.id, jobId],
  );
  await pool.query('UPDATE collections SET updated_at = NOW() WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: 'Added to collection' });
});

router.post('/share/:jobId', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, share_token, is_public FROM audio_jobs WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
    [req.params.jobId, req.user.id],
  );
  if (!rows[0]) throw createError(404, 'Completed job not found');

  let token = rows[0].share_token;
  if (!token) {
    token = crypto.randomBytes(12).toString('hex');
    await pool.query(
      'UPDATE audio_jobs SET share_token = $1, is_public = true WHERE id = $2',
      [token, req.params.jobId],
    );
  } else {
    await pool.query('UPDATE audio_jobs SET is_public = true WHERE id = $1', [req.params.jobId]);
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  res.json({
    success: true,
    data: { shareToken: token, shareUrl: `${frontendUrl}/r/${token}` },
  });
});

router.delete('/share/:jobId', authenticate, async (req, res) => {
  await pool.query(
    'UPDATE audio_jobs SET is_public = false WHERE id = $1 AND user_id = $2',
    [req.params.jobId, req.user.id],
  );
  res.json({ success: true, message: 'Sharing disabled' });
});

module.exports = router;
