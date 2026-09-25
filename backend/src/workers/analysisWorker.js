require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker, UnrecoverableError } = require('bullmq');
const axios = require('axios');
const { pool } = require('../db/client');
const { persistAnalysisResult } = require('../services/analysisResults');
const { deleteFromS3 } = require('../services/storage');
const { describeMlError, isPermanentMlError } = require('../services/queue');
const logger = require('../utils/logger');

async function deleteSourceAudio(s3Key, jobId) {
  if (!s3Key) return;
  try {
    await deleteFromS3(s3Key);
    logger.info('Deleted source audio from storage after analysis', { jobId, s3Key });
  } catch (err) {
    logger.warn('Failed to delete source audio from storage', { jobId, s3Key, error: err.message });
  }
}

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
  ...parseRedisUrl(process.env.REDIS_URL),
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  lazyConnect: true,
};

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

function emitToUser(userId, event, payload) {
  try {
    const { getIO } = require('../db/socketio');
    getIO().to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    /* ignore */
  }
}

let worker;
try {
  worker = new Worker('audio-analysis', async (job) => {
    let { jobId, userId, s3Key, s3Url, originalFilename } = job.data;
    logger.info('Processing analysis job', { jobId });

    if (!originalFilename) {
      const { rows } = await pool.query(
        'SELECT original_filename FROM audio_jobs WHERE id = $1',
        [jobId]
      );
      originalFilename = rows[0]?.original_filename;
    }

    await pool.query("UPDATE audio_jobs SET status = 'processing', started_at = NOW() WHERE id = $1", [jobId]);
    emitToUser(userId, 'job:progress', { jobId, status: 'processing', progress: 10 });
    await pool.query('UPDATE audio_jobs SET progress = $1 WHERE id = $2', [10, jobId]);

    // BullMQ retries a thrown job (see defaultJobOptions in services/queue.js).
    // Marking it 'failed' on an attempt that will be retried made the UI give
    // up — and show an error — while the job was still going to run again.
    const isFinalAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);

    async function fail(message, err, { permanent = false } = {}) {
      if (!permanent && !isFinalAttempt) {
        logger.warn('Analysis attempt failed, will retry', { jobId, attempt: job.attemptsMade + 1, error: message });
        await pool.query("UPDATE audio_jobs SET status = 'queued', progress = 0 WHERE id = $1", [jobId]);
        emitToUser(userId, 'job:progress', { jobId, status: 'retrying', progress: 5 });
        throw err;
      }
      await pool.query(
        "UPDATE audio_jobs SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2",
        [message, jobId]
      );
      emitToUser(userId, 'job:failed', { jobId, error: message });
      throw permanent ? new UnrecoverableError(message) : err;
    }

    let mlResult;
    try {
      emitToUser(userId, 'job:progress', { jobId, status: 'analyzing', progress: 30 });
      await pool.query('UPDATE audio_jobs SET progress = $1 WHERE id = $2', [30, jobId]);
      const response = await axios.post(`${ML_URL}/analyze`, {
        job_id: jobId,
        s3_key: s3Key,
        s3_url: s3Url,
        original_filename: originalFilename,
      }, { timeout: 240000 });
      mlResult = response.data;
    } catch (err) {
      const message = describeMlError(err);
      logger.error('ML service failed', { jobId, status: err.response?.status, error: message });
      await fail(message, err, { permanent: isPermanentMlError(err) });
    }

    // --- Post-ML processing (persist, complete, cleanup) ---
    try {
      emitToUser(userId, 'job:progress', { jobId, status: 'saving', progress: 70 });
      await pool.query('UPDATE audio_jobs SET progress = $1 WHERE id = $2', [70, jobId]);

      await persistAnalysisResult({ jobId, mlResult });

      await pool.query(
        "UPDATE audio_jobs SET status = 'completed', completed_at = NOW(), progress = 100 WHERE id = $1",
        [jobId]
      );

      // Only after the job is recorded as complete: deleting first meant a
      // failure above left a retry with no audio to download.
      await deleteSourceAudio(s3Key, jobId);

      try {
        await pool.query(
          `INSERT INTO usage_tracking (user_id, job_id, action, plan_at_time)
           VALUES ($1, $2, 'analysis_completed', (SELECT plan FROM users WHERE id = $1))`,
          [userId, jobId]
        );
      } catch (e) { /* ignore usage tracking errors */ }

      emitToUser(userId, 'job:completed', { jobId, status: 'completed', progress: 100 });
      logger.info('Analysis job completed', { jobId });
      return { jobId, status: 'completed' };

    } catch (err) {
      // persistAnalysisResult or DB update failed
      logger.error('Post-analysis persistence failed', { jobId, error: err.message, stack: err.stack });
      await fail(`Could not save the analysis results: ${err.message}`, err);
    }
  }, {
    connection,
    concurrency: 4,
  });

  worker.on('error', (err) => {
    logger.error('BullMQ worker error', { error: err.message });
  });

  worker.waitUntilReady().catch(() => {});
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
