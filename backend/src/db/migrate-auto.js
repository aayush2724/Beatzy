/**
 * Automatic migrations runner — called during server bootstrap.
 * Uses the shared pool from client.js so no extra connection is created.
 * Applies any pending .sql migrations from /migrations in order.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./client');
const logger = require('../utils/logger');

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(migrationsDir)) {
      logger.info('No migrations directory found, skipping auto-migrate');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let applied = 0;
    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [file],
      );
      if (rows.length > 0) continue;

      logger.info(`Applying migration ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        applied++;
        logger.info(`Applied migration ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Migration ${file} failed`, { error: err.message });
        throw err;
      }
    }

    if (applied > 0) {
      logger.info(`Auto-migrate complete: ${applied} migration(s) applied`);
    } else {
      logger.info('Auto-migrate: all migrations already applied');
    }
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
