const express = require('express');
const { authenticateApiKey } = require('../middleware/auth');
const { pool } = require('../db/client');
const { getCache, setCache } = require('../db/redis');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/:jobId', authenticateApiKey, async (req, res) => {
  const cacheKey = `result:${req.params.jobId}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const { rows } = await pool.query(
    `SELECT r.*, j.original_filename, j.created_at as job_created_at, j.status
     FROM analysis_results r
     JOIN audio_jobs j ON j.id = r.job_id
     WHERE r.job_id = $1 AND j.user_id = $2`,
    [req.params.jobId, req.user.id]
  );

  if (!rows[0]) {
    const { rows: jobRows } = await pool.query(
      'SELECT id, status FROM audio_jobs WHERE id = $1 AND user_id = $2',
      [req.params.jobId, req.user.id]
    );
    if (!jobRows[0]) throw createError(404, 'Job not found');
    if (jobRows[0].status === 'processing' || jobRows[0].status === 'queued') {
      return res.status(202).json({
        success: true,
        data: { status: jobRows[0].status, message: 'Analysis in progress' },
      });
    }
    throw createError(404, 'Results not found');
  }

  await setCache(cacheKey, rows[0], 3600);
  res.json({ success: true, data: rows[0] });
});

router.get('/', authenticateApiKey, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.job_id, r.song_title, r.song_artist, r.song_album, r.bpm, r.energy_level,
            r.mood, r.key_signature, r.time_signature, r.created_at,
            j.original_filename
     FROM analysis_results r
     JOIN audio_jobs j ON j.id = r.job_id
     WHERE j.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 100`,
    [req.user.id]
  );
  res.json({ success: true, data: rows });
});

module.exports = router;
