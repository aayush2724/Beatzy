const logger = require('../utils/logger');

let analysisQueue = null;
let useQueue = false;

function parseRedisConnection() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379'),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConnection = {
  ...parseRedisConnection(),
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
  const { jobId, userId, s3Key, s3Url, originalFilename } = data;
  const { pool } = require('../db/client');
  const { persistAnalysisResult } = require('./analysisResults');
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
    let filename = originalFilename;
    if (!filename) {
      const { rows } = await pool.query(
        'SELECT original_filename FROM audio_jobs WHERE id = $1',
        [jobId]
      );
      filename = rows[0]?.original_filename;
    }

    await pool.query("UPDATE audio_jobs SET status = 'processing', started_at = NOW() WHERE id = $1", [jobId]);
    emit('job:progress', { jobId, status: 'processing', progress: 10 });

    emit('job:progress', { jobId, status: 'analyzing', progress: 30 });
    const response = await axios.post(`${ML_URL}/analyze`, {
      job_id: jobId,
      s3_key: s3Key,
      s3_url: s3Url,
      original_filename: filename,
    }, { timeout: 240000 });
    const mlResult = response.data;

    emit('job:progress', { jobId, status: 'saving', progress: 70 });

    await persistAnalysisResult({ jobId, mlResult });

    try {
      const { deleteFromS3 } = require('./storage');
      await deleteFromS3(s3Key);
      logger.info('Deleted source audio from storage after analysis', { jobId, s3Key });
    } catch (delErr) {
      logger.warn('Failed to delete source audio from storage', { jobId, s3Key, error: delErr.message });
    }

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
