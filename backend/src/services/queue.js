const logger = require('../utils/logger');

let analysisQueue = null;
let useQueue = false;

const redisConnection = {
  host: process.env.REDIS_HOST || (() => {
    try { return new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname; } catch { return 'localhost'; }
  })(),
  port: parseInt(process.env.REDIS_PORT || (() => {
    try { return new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'; } catch { return '6379'; }
  })()),
  password: process.env.REDIS_PASSWORD || (() => {
    try { return new URL(process.env.REDIS_URL || '').password || undefined; } catch { return undefined; }
  })(),
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  lazyConnect: true,
};

async function initQueue() {
  let q = null;
  try {
    const { Queue } = require('bullmq');
    q = new Queue('audio-analysis', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
    await Promise.race([
      q.waitUntilReady(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Redis timeout')), 2000)),
    ]);
    analysisQueue = q;
    useQueue = true;
    logger.info('BullMQ queue ready');
  } catch (err) {
    logger.warn('BullMQ unavailable, using inline processing', { error: err.message });
    useQueue = false;
    if (q) { try { await q.close(); } catch (e) { /* ignore */ } }
  }
}

async function processJobDirectly(data) {
  const { jobId, userId, s3Key, s3Url } = data;
  const { pool } = require('../db/client');
  const axios = require('axios');
  const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

  function emit(event, payload) {
    try {
      const { getIO } = require('../db/socketio');
      getIO().to(`user:${userId}`).emit(event, payload);
    } catch (e) {
      /* ignore */
    }
  }

  try {
    await pool.query("UPDATE audio_jobs SET status = 'processing', started_at = NOW() WHERE id = $1", [jobId]);
    emit('job:progress', { jobId, status: 'processing', progress: 10 });

    emit('job:progress', { jobId, status: 'analyzing', progress: 30 });
    const response = await axios.post(`${ML_URL}/analyze`, {
      job_id: jobId,
      s3_key: s3Key,
      s3_url: s3Url,
    }, { timeout: 180000 });
    const mlResult = response.data;

    emit('job:progress', { jobId, status: 'saving', progress: 70 });

    await pool.query(
      `INSERT INTO analysis_results (
        job_id, song_title, song_artist, song_album, song_release_year,
        isrc, acr_id, bpm, energy_level, mood, mood_confidence,
        key_signature, time_signature,
        spectral_centroid, spectral_rolloff, zero_crossing_rate,
        yamnet_labels, confidence_scores,
        spotify_features,
        raw_acr_response, raw_ml_response
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      ON CONFLICT (job_id) DO UPDATE SET
        song_title = EXCLUDED.song_title,
        song_artist = EXCLUDED.song_artist,
        mood_confidence = EXCLUDED.mood_confidence,
        spotify_features = EXCLUDED.spotify_features,
        updated_at = NOW()`,
      [
        jobId,
        mlResult.song?.title,
        mlResult.song?.artist,
        mlResult.song?.album,
        mlResult.song?.release_year,
        mlResult.song?.isrc,
        mlResult.song?.acr_id,
        mlResult.audio?.bpm,
        mlResult.audio?.energy_level,
        mlResult.audio?.mood,
        mlResult.audio?.mood_confidence || 0,
        mlResult.audio?.key_signature,
        mlResult.audio?.time_signature,
        mlResult.audio?.spectral_centroid,
        mlResult.audio?.spectral_rolloff,
        mlResult.audio?.zero_crossing_rate,
        JSON.stringify(mlResult.yamnet?.labels || []),
        JSON.stringify(mlResult.yamnet?.confidence_scores || []),
        JSON.stringify(mlResult.spotify || {}),
        JSON.stringify(mlResult.song || {}),
        JSON.stringify(mlResult),
      ]
    );

    await pool.query("UPDATE audio_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1", [jobId]);

    try {
      await pool.query(
        `INSERT INTO usage_tracking (user_id, job_id, action, plan_at_time)
         VALUES ($1, $2, 'analysis_completed', (SELECT plan FROM users WHERE id = $1))`,
        [userId, jobId]
      );
    } catch (e) {
      /* ignore */
    }

    emit('job:completed', { jobId, status: 'completed', progress: 100 });
    logger.info('Inline job completed', { jobId });
  } catch (err) {
    logger.error('Inline job failed', { jobId, error: err.message });
    await pool.query(
      "UPDATE audio_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
      [err.message, jobId]
    );
    emit('job:failed', { jobId, error: err.message });
  }
}

async function enqueueAnalysisJob(data) {
  if (useQueue && analysisQueue) {
    try {
      const job = await analysisQueue.add('analyze', data, {
        jobId: data.jobId,
        priority: data.priority || 0,
      });
      logger.info('Job enqueued to BullMQ', { jobId: data.jobId });
      return job;
    } catch (err) {
      logger.warn('BullMQ enqueue failed, falling back to inline', { error: err.message });
    }
  }
  setImmediate(() => processJobDirectly(data));
  logger.info('Job queued for inline processing', { jobId: data.jobId });
  return { id: data.jobId };
}

async function getQueueStats() {
  if (useQueue && analysisQueue) {
    const [waiting, active, completed, failed] = await Promise.all([
      analysisQueue.getWaitingCount(),
      analysisQueue.getActiveCount(),
      analysisQueue.getCompletedCount(),
      analysisQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
  return { waiting: 0, active: 0, completed: 0, failed: 0, mode: 'inline' };
}

module.exports = { analysisQueue: { get: () => analysisQueue }, enqueueAnalysisJob, getQueueStats, initQueue };
