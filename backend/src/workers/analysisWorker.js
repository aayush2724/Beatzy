require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const axios = require('axios');
const { pool } = require('../db/client');
const { persistAnalysisResult } = require('../services/analysisResults');
const { deleteFromS3 } = require('../services/storage');
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

    let mlResult;
    try {
      emitToUser(userId, 'job:progress', { jobId, status: 'analyzing', progress: 30 });
      const response = await axios.post(`${ML_URL}/analyze`, {
        job_id: jobId,
        s3_key: s3Key,
        s3_url: s3Url,
        original_filename: originalFilename,
      }, { timeout: 240000 });
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

    await persistAnalysisResult({ jobId, mlResult });

    await deleteSourceAudio(s3Key, jobId);

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
