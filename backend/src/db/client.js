const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

// Managed Postgres can take several seconds to accept connections after a
// cold start, so retry with backoff instead of failing the boot on one timeout.
async function connectDB({ attempts = 5, delayMs = 2000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      logger.info('PostgreSQL connected');
      return;
    } catch (err) {
      if (attempt >= attempts) throw err;
      logger.warn('PostgreSQL connection failed, retrying', { attempt, error: err.message });
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

module.exports = { pool, connectDB };
