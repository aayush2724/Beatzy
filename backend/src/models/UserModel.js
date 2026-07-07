const { pool } = require('../db/client');

class UserModel {
  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  }

  static async updateGoogleId(userId, googleId) {
    await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, userId]);
  }

  static async createGoogleUser(id, name, email, googleId) {
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, google_id, plan, is_active)
       VALUES ($1, $2, $3, $4, 'pro', true) RETURNING *`,
      [id, name, email, googleId]
    );
    return rows[0];
  }

  static async updateRefreshToken(userId, refreshHash, expiresAt) {
    await pool.query(
      'UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3',
      [refreshHash, expiresAt, userId]
    );
  }

  static async existsByEmail(email) {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return !!rows[0];
  }

  static async createUser(id, name, email, passwordHash) {
    const { rows } = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, plan, is_active)
       VALUES ($1, $2, $3, $4, 'pro', true) RETURNING id, name, email, plan, is_admin`,
      [id, name, email, passwordHash]
    );
    return rows[0];
  }

  static async updateLastLogin(userId) {
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
  }

  static async verifyRefreshToken(userId, incomingHash) {
    const { rows } = await pool.query(
      `SELECT id FROM users
       WHERE id = $1 AND is_active = true
         AND refresh_token_hash = $2
         AND refresh_token_expires_at > NOW()`,
      [userId, incomingHash]
    );
    return !!rows[0];
  }

  static async revokeRefreshToken(userId) {
    await pool.query(
      'UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = $1',
      [userId]
    );
  }

  static async getUserStats(userId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.plan, u.created_at, u.last_login_at,
              COUNT(DISTINCT j.id) as total_jobs,
              COUNT(DISTINCT ak.id) FILTER (WHERE ak.is_active) as active_api_keys
       FROM users u
       LEFT JOIN audio_jobs j ON j.user_id = u.id
       LEFT JOIN api_keys ak ON ak.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    return rows[0];
  }

  static async updateName(userId, name) {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, plan',
      [name, userId]
    );
    return rows[0];
  }

  static async getPasswordHash(userId) {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    return rows[0]?.password_hash;
  }

  static async updatePassword(userId, passwordHash) {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  }

  static async getDailyUsage(userId) {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as jobs
       FROM audio_jobs
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );
    return rows;
  }
}

module.exports = UserModel;
