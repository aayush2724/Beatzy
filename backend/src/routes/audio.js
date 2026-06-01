const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { planRateLimit, PLAN_LIMITS } = require('../middleware/rateLimit');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');
const { uploadToS3 } = require('../services/storage');
const { enqueueAnalysisJob } = require('../services/queue');
const logger = require('../utils/logger');

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const ALLOWED_MIME = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/x-flac', 'audio/webm'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(createError(415, `Unsupported file type: ${file.mimetype}`));
  },
});

router.post('/upload', authenticateApiKey, planRateLimit, upload.single('audio'), async (req, res) => {
  if (!req.file) throw createError(400, 'No audio file provided');

  const plan = req.user.plan || 'free';
  const maxSize = PLAN_LIMITS[plan].uploadSizeMB * 1024 * 1024;
  if (req.file.size > maxSize) {
    throw createError(413, `File exceeds ${PLAN_LIMITS[plan].uploadSizeMB}MB limit for your plan`);
  }

  const jobId = uuidv4();
  const s3Key = `audio/${req.user.id}/${jobId}/${req.file.originalname}`;

  const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);

  const { rows } = await pool.query(
    `INSERT INTO audio_jobs (id, user_id, original_filename, s3_key, s3_url, file_size, mime_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued') RETURNING id, status, created_at`,
    [jobId, req.user.id, req.file.originalname, s3Key, s3Url, req.file.size, req.file.mimetype]
  );

  await enqueueAnalysisJob({ jobId, userId: req.user.id, s3Key, s3Url });

  logger.info('Audio job queued', { jobId, userId: req.user.id });

  res.status(202).json({
    success: true,
    data: {
      jobId: rows[0].id,
      status: rows[0].status,
      createdAt: rows[0].created_at,
      message: 'Audio uploaded and queued for analysis',
    },
  });
});

// ── Search songs via Spotify (proxy to ML service) ──────────────────────────
router.get('/search', authenticateApiKey, async (req, res) => {
  const { q, limit } = req.query;
  if (!q) throw createError(400, 'Query parameter "q" is required');

  try {
    const { data } = await axios.get(`${ML_SERVICE_URL}/spotify/search`, {
      params: { q, limit: limit || 10 },
      timeout: 15000,
    });
    res.json(data);
  } catch (err) {
    logger.error('Spotify search proxy failed', { error: err.message });
    throw createError(502, 'Song search service unavailable');
  }
});

// ── Analyze a remote audio URL (e.g. Spotify preview) ───────────────────────
router.post('/analyze-url', authenticateApiKey, planRateLimit, async (req, res) => {
  const { url, title, artist } = req.body;
  if (!url) throw createError(400, 'Field "url" is required');

  // Download the remote audio into a buffer
  let audioBuffer;
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
    });
    audioBuffer = Buffer.from(response.data);
  } catch (err) {
    logger.error('Failed to download remote audio', { url, error: err.message });
    throw createError(502, 'Could not download audio from the provided URL');
  }

  const jobId = uuidv4();
  const filename = `${(title || 'preview').replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
  const s3Key = `audio/${req.user.id}/${jobId}/${filename}`;

  const s3Url = await uploadToS3(audioBuffer, s3Key, 'audio/mpeg');

  const { rows } = await pool.query(
    `INSERT INTO audio_jobs (id, user_id, original_filename, s3_key, s3_url, file_size, mime_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued') RETURNING id, status, created_at`,
    [jobId, req.user.id, filename, s3Key, s3Url, audioBuffer.length, 'audio/mpeg']
  );

  await enqueueAnalysisJob({ jobId, userId: req.user.id, s3Key, s3Url });

  logger.info('Remote audio job queued', { jobId, userId: req.user.id, title, artist });

  res.status(202).json({
    success: true,
    data: {
      jobId: rows[0].id,
      status: rows[0].status,
      createdAt: rows[0].created_at,
      message: 'Audio downloaded and queued for analysis',
    },
  });
});

router.get('/jobs/:jobId', authenticateApiKey, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT j.id, j.status, j.original_filename, j.created_at, j.completed_at, j.error_message,
            r.id as result_id
     FROM audio_jobs j
     LEFT JOIN analysis_results r ON r.job_id = j.id
     WHERE j.id = $1 AND j.user_id = $2`,
    [req.params.jobId, req.user.id]
  );
  if (!rows[0]) throw createError(404, 'Job not found');
  res.json({ success: true, data: rows[0] });
});

router.get('/history', authenticateApiKey, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(
    `SELECT j.id, j.original_filename, j.status, j.created_at, j.completed_at,
            r.song_title, r.song_artist, r.bpm, r.mood
     FROM audio_jobs j
     LEFT JOIN analysis_results r ON r.job_id = j.id
     WHERE j.user_id = $1
     ORDER BY j.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM audio_jobs WHERE user_id = $1',
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      jobs: rows,
      pagination: {
        page,
        limit,
        total: parseInt(countRows[0].count),
        pages: Math.ceil(countRows[0].count / limit),
      },
    },
  });
});

router.delete('/jobs/:jobId', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM audio_jobs WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.jobId, req.user.id]
  );
  if (!rows[0]) throw createError(404, 'Job not found');
  res.json({ success: true, message: 'Job deleted' });
});

module.exports = router;
