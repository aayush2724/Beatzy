const { Queue } = require('bullmq');
const { redisClient } = require('../db/redis');
const logger = require('../utils/logger');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

const analysisQueue = new Queue('audio-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

async function enqueueAnalysisJob(data) {
  const job = await analysisQueue.add('analyze', data, {
    jobId: data.jobId,
    priority: data.priority || 0,
  });
  logger.info('Job enqueued', { jobId: data.jobId, bullJobId: job.id });
  return job;
}

async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    analysisQueue.getWaitingCount(),
    analysisQueue.getActiveCount(),
    analysisQueue.getCompletedCount(),
    analysisQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}

module.exports = { analysisQueue, enqueueAnalysisJob, getQueueStats };
