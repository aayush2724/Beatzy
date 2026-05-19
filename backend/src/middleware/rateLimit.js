const rateLimit = require('express-rate-limit');
const { redisClient } = require('../db/redis');

const PLAN_LIMITS = {
  free: { requestsPerDay: 100, uploadSizeMB: 10 },
  pro: { requestsPerDay: 5000, uploadSizeMB: 50 },
  enterprise: { requestsPerDay: Infinity, uploadSizeMB: 200 },
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

  const key = `usage:${req.user.id}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redisClient.incr(key);
  if (count === 1) await redisClient.expire(key, 86400);

  res.setHeader('X-RateLimit-Limit', limits.requestsPerDay);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limits.requestsPerDay - count));

  if (count > limits.requestsPerDay) {
    return res.status(429).json({
      success: false,
      error: { message: `Daily limit of ${limits.requestsPerDay} requests reached. Upgrade your plan.` },
    });
  }
  next();
}

module.exports = { globalLimiter, authLimiter, planRateLimit, PLAN_LIMITS };
