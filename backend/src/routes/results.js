const express = require('express');
const { authenticateApiKey } = require('../middleware/auth');
const { pool } = require('../db/client');
const { getCache, setCache } = require('../db/redis');
const { createError } = require('../middleware/errorHandler');
const { getPresignedUrl } = require('../services/storage');

const router = express.Router();

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
    [req.user.id],
  );
  res.json({ success: true, data: rows });
});

router.get('/:jobId/export', authenticateApiKey, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, j.original_filename, j.created_at as job_created_at
     FROM analysis_results r
     JOIN audio_jobs j ON j.id = r.job_id
     WHERE r.job_id = $1 AND j.user_id = $2`,
    [req.params.jobId, req.user.id],
  );
  if (!rows[0]) throw createError(404, 'Results not found');

  const report = {
    exported_at: new Date().toISOString(),
    job_id: rows[0].job_id,
    song: {
      title: rows[0].song_title,
      artist: rows[0].song_artist,
      album: rows[0].song_album,
    },
    audio: {
      bpm: rows[0].bpm,
      key: rows[0].key_signature,
      scale: rows[0].scale,
      mood: rows[0].mood,
      energy: rows[0].energy_level,
      time_signature: rows[0].time_signature,
    },
    chords: rows[0].chords,
    spotify: rows[0].spotify_features,
    lyrics: rows[0].lyrics,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="beatzy-report-${req.params.jobId.slice(0, 8)}.json"`);
  res.send(JSON.stringify(report, null, 2));
});

router.get('/:jobId', authenticateApiKey, async (req, res) => {
  const cacheKey = `result:${req.params.jobId}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, status: 'complete', data: cached, cached: true });

  const { rows } = await pool.query(
    `SELECT r.*, j.original_filename, j.s3_key, j.created_at as job_created_at, j.status, j.error_message, j.progress
     FROM audio_jobs j
     LEFT JOIN analysis_results r ON r.job_id = j.id
     WHERE j.id = $1 AND j.user_id = $2`,
    [req.params.jobId, req.user.id],
  );

  if (!rows[0]) {
    throw createError(404, 'Job not found');
  }

  const job = rows[0];

  if (job.status === 'queued' || job.status === 'processing') {
    return res.status(202).json({
      success: true,
      status: 'processing',
      jobId: req.params.jobId,
      progress: { percent: job.progress || 10 },
      message: 'Analysis in progress'
    });
  }

  if (job.status === 'failed') {
    return res.json({
      success: true,
      status: 'failed',
      error: job.error_message || 'Analysis failed'
    });
  }

  // If status is completed but no result record yet (rare race condition)
  if (!job.id && job.status === 'completed') {
    return res.status(202).json({
      success: true,
      status: 'processing',
      jobId: req.params.jobId,
      message: 'Finalizing results'
    });
  }

  const result = { ...job };
  if (result.s3_key) {
    try {
      result.audio_url = await getPresignedUrl(result.s3_key);
    } catch {
      result.audio_url = null;
    }
  }
  delete result.s3_key;

  await setCache(cacheKey, result, 3600);
  res.json({ success: true, status: 'complete', data: result });
});

module.exports = router;
