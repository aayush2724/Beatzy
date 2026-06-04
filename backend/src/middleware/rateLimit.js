const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const PLAN_LIMITS = {
  free: { requestsPerDay: 100, analysesPerMonth: 5, uploadSizeMB: 10, batchSize: 1 },
  pro: { requestsPerDay: 5000, analysesPerMonth: 100, uploadSizeMB: 50, batchSize: 5 },
  enterprise: { requestsPerDay: Infinity, analysesPerMonth: Infinity, uploadSizeMB: 200, batchSize: 20 },
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please slow down.' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { message: 'Too many auth attempts.' } },
});

async function planRateLimit(req, res, next) {
  if (!req.user) return next();
  const plan = req.user.plan || 'free';
  const limits = PLAN_LIMITS[plan];
  if (limits.requestsPerDay === Infinity) return next();

  try {
    const { redisClient } = require('../db/redis');
    const key = `usage:${req.user.id}:${new Date().toISOString().slice(0, 10)}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, 86400);

    res.setHeader('X-RateLimit-Limit', limits.requestsPerDay);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limits.requestsPerDay - count));

    if (count > limits.requestsPerDay) {
      return res.status(429).json({
        success: false,
        error: { message: `Daily limit of ${limits.requestsPerDay} requests reached.` },
      });
    }
  } catch (err) {
    logger.warn('Rate limit check failed (skipping)', { error: err.message });
  }
  next();
}

async function monthlyAnalysisLimit(req, res, next) {
  if (!req.user) return next();
  const plan = req.user.plan || 'free';
  const limit = PLAN_LIMITS[plan].analysesPerMonth;
  if (limit === Infinity) return next();

  try {
    const { pool } = require('../db/client');
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM audio_jobs
       WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())`,
      [req.user.id],
    );
    const used = rows[0]?.count || 0;
    res.setHeader('X-Analyses-Limit', limit);
    res.setHeader('X-Analyses-Remaining', Math.max(0, limit - used));
    if (used >= limit) {
      return res.status(429).json({
        success: false,
        error: { message: `Monthly analysis limit (${limit}) reached. Upgrade your plan.` },
      });
    }
  } catch (err) {
    logger.warn('Monthly limit check failed (skipping)', { error: err.message });
  }
  next();
}

module.exports = { globalLimiter, authLimiter, planRateLimit, monthlyAnalysisLimit, PLAN_LIMITS };
