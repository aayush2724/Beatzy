require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const axios = require('axios');
const { pool } = require('../db/client');
const logger = require('../utils/logger');

function parseRedisUrl(url) {
  try {
    const u = new URL(url || 'redis://localhost:6379');
    return {
      host: u.hostname || 'localhost',
      port: parseInt(u.port || '6379'),
      password: u.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const connection = {
  ...(process.env.REDIS_HOST
    ? {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    : parseRedisUrl(process.env.REDIS_URL)),
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
};

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

function emitToUser(userId, event, payload) {
  try {
    const { getIO } = require('../db/socketio');
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch {}
}

let worker;
try {
  worker = new Worker('audio-analysis', async (job) => {
    const { jobId, userId, s3Key, s3Url } = job.data;
    logger.info('Processing analysis job', { jobId });

    await pool.query("UPDATE audio_jobs SET status = 'processing', started_at = NOW() WHERE id = $1", [jobId]);
    emitToUser(userId, 'job:progress', { jobId, status: 'processing', progress: 10 });

    let mlResult;
    try {
      emitToUser(userId, 'job:progress', { jobId, status: 'analyzing', progress: 30 });
      const response = await axios.post(`${ML_URL}/analyze`, {
        job_id: jobId,
        s3_key: s3Key,
        s3_url: s3Url,
      }, { timeout: 180000 });
      mlResult = response.data;
      emitToUser(userId, 'job:progress', { jobId, status: 'saving', progress: 70 });
    } catch (err) {
      logger.error('ML service failed', { jobId, error: err.message });
      await pool.query(
        "UPDATE audio_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
        [err.message, jobId]
      );
      emitToUser(userId, 'job:failed', { jobId, error: err.message });
      throw err;
    }

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
    } catch {}

    emitToUser(userId, 'job:completed', { jobId, status: 'completed', progress: 100 });
    logger.info('Analysis job completed', { jobId });
    return { jobId, status: 'completed' };
  }, {
    connection,
    concurrency: 4,
  });

  worker.on('failed', (job, err) => {
    logger.error('Job permanently failed', { jobId: job?.data?.jobId, error: err.message });
  });
  worker.on('completed', (job) => {
    logger.info('Worker completed job', { bullJobId: job.id });
  });
  logger.info('BullMQ analysis worker started');
} catch (err) {
  logger.warn('BullMQ worker could not start (Redis unavailable, using inline processing)', { error: err.message });
}

module.exports = { worker };
