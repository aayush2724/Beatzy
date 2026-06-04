const express = require('express');
const axios = require('axios');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/r/:shareToken', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.job_id, r.song_title, r.song_artist, r.song_album, r.bpm, r.energy_level,
            r.mood, r.key_signature, r.scale, r.chords, r.spotify_features,
            j.share_token, j.completed_at
     FROM analysis_results r
     JOIN audio_jobs j ON j.id = r.job_id
     WHERE j.share_token = $1 AND j.is_public = true AND j.status = 'completed'`,
    [req.params.shareToken],
  );
  if (!rows[0]) throw createError(404, 'Shared result not found or not public');
  res.json({ success: true, data: rows[0] });
});

router.get('/status', async (req, res) => {
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const checks = { backend: 'ok', database: 'unknown', redis: 'unknown', ml: 'unknown' };

  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const { redisAvailable } = require('../db/redis');
    checks.redis = redisAvailable ? 'ok' : 'unavailable';
  } catch {
    checks.redis = 'error';
  }

  try {
    const { data } = await axios.get(`${mlUrl}/health`, { timeout: 8000 });
    checks.ml = data?.status === 'ok' ? 'ok' : 'degraded';
    checks.ml_storage = data?.storage?.reachable ?? null;
  } catch {
    checks.ml = 'error';
  }

  const overall = Object.values(checks).every((v) => v === 'ok' || v === 'unavailable') ? 'operational' : 'degraded';
  res.json({ success: true, data: { status: overall, checks, timestamp: new Date().toISOString() } });
});

module.exports = router;
