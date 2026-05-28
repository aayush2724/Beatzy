/**
 * Audit logging service — writes structured events to the `audit_logs` table.
 *
 * Usage:
 *   const { logAudit } = require('../services/audit');
 *   await logAudit({ userId, action: 'user.login', meta: { ip: req.ip } });
 */
const { pool } = require('../db/client');
const logger = require('../utils/logger');

/**
 * @param {object} opts
 * @param {string}  opts.userId   — UUID of the acting user (nullable for system events).
 * @param {string}  opts.action   — dot‑separated action identifier, e.g. 'user.login'.
 * @param {object}  [opts.meta]   — additional JSON metadata.
 * @param {string}  [opts.ip]     — client IP address.
 */
async function logAudit({ userId = null, action, meta = {}, ip = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [userId, action, JSON.stringify(meta), ip],
    );
  } catch (err) {
    // Never let audit failures break the main flow
    logger.error('Audit log write failed', { action, error: err.message });
  }
}

module.exports = { logAudit };
