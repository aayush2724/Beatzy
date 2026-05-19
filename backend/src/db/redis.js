const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
redisClient.on('connect', () => logger.info('Redis connected'));

async function connectRedis() {
  await redisClient.connect();
}

async function getCache(key) {
  const val = await redisClient.get(key);
  return val ? JSON.parse(val) : null;
}

async function setCache(key, value, ttlSeconds = 3600) {
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
}

async function deleteCache(key) {
  await redisClient.del(key);
}

async function incrementCounter(key, ttlSeconds = 86400) {
  const count = await redisClient.incr(key);
  if (count === 1) await redisClient.expire(key, ttlSeconds);
  return count;
}

module.exports = { redisClient, connectRedis, getCache, setCache, deleteCache, incrementCounter };
