/**
 * Idempotency middleware — prevents duplicate side‑effects on retried POST/PATCH requests.
 *
 * Clients send an `Idempotency-Key` header (UUID).  If we've already processed a
 * request with that key, we return the cached response instead of re‑executing.
 * Cached responses are stored in Redis with a 24‑hour TTL.
 */
const { redisClient } = require('../db/redis');
const logger = require('../utils/logger');

const IDEMPOTENCY_TTL = 86400; // 24 hours
const REDIS_PREFIX = 'idem:';

function idempotency(req, res, next) {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // no key → no idempotency check

  const cacheKey = `${REDIS_PREFIX}${key}`;

  // Wrap response.json so we can intercept and cache the body
  const originalJson = res.json.bind(res);

  (async () => {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const { statusCode, body } = JSON.parse(cached);
        logger.debug('Idempotency cache hit', { key });
        res.setHeader('X-Idempotency-Replayed', 'true');
        return res.status(statusCode).json(body);
      }
    } catch (err) {
      // Redis down — proceed without idempotency to avoid blocking traffic
      logger.warn('Idempotency cache lookup failed, proceeding', { error: err.message });
      return next();
    }

    // Override res.json to capture + cache the response
    res.json = (body) => {
      const entry = JSON.stringify({ statusCode: res.statusCode, body });
      redisClient
        .setEx(cacheKey, IDEMPOTENCY_TTL, entry)
        .catch((err) => logger.warn('Idempotency cache write failed', { error: err.message }));
      return originalJson(body);
    };

    next();
  })();
}

module.exports = { idempotency };
