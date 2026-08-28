/**
 * Idempotency middleware — prevents duplicate side‑effects on retried POST/PATCH requests.
 *
 * Clients send an `Idempotency-Key` header (UUID).  If we've already processed a
 * request with that key, we return the cached response instead of re‑executing.
 * Cached responses are stored in Redis with a 24‑hour TTL.
 */
const crypto = require('crypto');
const { redisClient } = require('../db/redis');
const logger = require('../utils/logger');

const IDEMPOTENCY_TTL = 86400; // 24 hours
const REDIS_PREFIX = 'idem:';
const REPLAYABLE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Build a cache key bound to the caller as well as the request.
 *
 * This middleware runs before authentication, so `req.user` is not available
 * yet — we fingerprint the raw credential instead. Without this, an
 * `Idempotency-Key` is a global handle: anyone replaying another user's key
 * would be served that user's cached response.
 */
function buildCacheKey(req, key) {
  const credential = req.headers['x-api-key'] || req.headers.authorization || 'anonymous';
  const identity = crypto.createHash('sha256').update(credential).digest('hex').slice(0, 32);
  const scope = `${identity}:${req.method}:${req.originalUrl}:${key}`;
  return REDIS_PREFIX + crypto.createHash('sha256').update(scope).digest('hex');
}

async function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // no key → no idempotency check

  // Replaying a GET would just serve stale reads from a client-controlled key.
  if (!REPLAYABLE_METHODS.has(req.method)) return next();

  if (!KEY_PATTERN.test(key)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Idempotency-Key must be 8-128 characters of [A-Za-z0-9._:-]' },
    });
  }

  const cacheKey = buildCacheKey(req, key);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const { statusCode, body } = JSON.parse(cached);
      logger.debug('Idempotency cache hit', { key });
      res.setHeader('X-Idempotency-Replayed', 'true');
      return res.status(statusCode).json(body);
    }
  } catch (err) {
    logger.warn('Idempotency cache lookup failed, proceeding', { error: err.message });
  }

  // Override res.json to capture + cache the response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Caching failures would pin a transient error for 24 hours.
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const entry = JSON.stringify({ statusCode: res.statusCode, body });
      redisClient
        .setEx(cacheKey, IDEMPOTENCY_TTL, entry)
        .catch((err) => logger.warn('Idempotency cache write failed', { error: err.message }));
    }
    return originalJson(body);
  };

  next();
}

module.exports = { idempotency };
