const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let redisAvailable = false;

const _cache = new Map();
const _counters = new Map();

const mockClient = {
  isReady: false,
  get: async (key) => _cache.get(key) ?? null,
  set: async (key, val) => { _cache.set(key, val); },
  setEx: async (key, ttl, val) => {
    _cache.set(key, val);
    setTimeout(() => _cache.delete(key), ttl * 1000);
  },
  del: async (key) => { _cache.delete(key); _counters.delete(key); },
  incr: async (key) => {
    const v = (_counters.get(key) || 0) + 1;
    _counters.set(key, v);
    return v;
  },
  expire: async (key, ttl) => {
    setTimeout(() => { _cache.delete(key); _counters.delete(key); }, ttl * 1000);
  },
};

async function connectRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let real = null;
  try {
    real = createClient({ url: redisUrl });
    real.on('error', () => {});
    await Promise.race([
      real.connect(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
    ]);
    redisClient = real;
    redisAvailable = true;
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable, using in-memory fallback', { error: err.message });
    try {
      if (real) {
        await real.disconnect();
      }
    } catch (e) {
      /* ignore */
    }
    redisClient = mockClient;
    redisAvailable = false;
  }
}

function getRedisClient() {
  return redisClient || mockClient;
}

async function getCache(key) {
  try {
    const val = await getRedisClient().get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 3600) {
  try {
    await getRedisClient().setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

async function deleteCache(key) {
  try {
    await getRedisClient().del(key);
  } catch {
    /* ignore */
  }
}

async function incrementCounter(key, ttlSeconds = 86400) {
  try {
    const count = await getRedisClient().incr(key);
    if (count === 1) await getRedisClient().expire(key, ttlSeconds);
    return count;
  } catch {
    return 1;
  }
}

module.exports = {
  get redisClient() { return getRedisClient(); },
  get redisAvailable() { return redisAvailable; },
  connectRedis,
  getCache,
  setCache,
  deleteCache,
  incrementCounter,
};
