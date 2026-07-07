const { pool } = require('../db/client');

class AdminModel {
  static async getUsersList(limit, offset) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.plan, u.is_active, u.is_admin,
              u.created_at, u.last_login_at,
              COUNT(DISTINCT j.id)::int AS total_jobs
       FROM users u
       LEFT JOIN audio_jobs j ON j.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  static async getTotalUsersCount() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM users');
    return rows[0].total;
  }

  static async getUserDetails(userId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.plan, u.is_active, u.is_admin,
              u.created_at, u.last_login_at, u.subscription_status,
              COUNT(DISTINCT j.id)::int AS total_jobs
       FROM users u
       LEFT JOIN audio_jobs j ON j.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    return rows[0];
  }

  static async updateUserFlags(userId, sets, vals) {
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING id, name, email, plan, is_active, is_admin`,
      vals
    );
    return rows[0];
  }

  static async getJobsByStatus() {
    const { rows } = await pool.query(`SELECT status, COUNT(*)::int AS count FROM audio_jobs GROUP BY status`);
    return rows;
  }

  static async getUsersByPlan() {
    const { rows } = await pool.query(`SELECT plan, COUNT(*)::int AS count FROM users GROUP BY plan`);
    return rows;
  }

  static async getAuditLogs(limit, offset) {
    const { rows } = await pool.query(
      `SELECT a.id, a.user_id, u.email, a.action, a.metadata, a.ip_address, a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  static async getTotalAuditLogsCount() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM audit_logs');
    return rows[0].total;
  }
}

module.exports = AdminModel;
