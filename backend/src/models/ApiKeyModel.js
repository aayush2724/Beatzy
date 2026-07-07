const { pool } = require('../db/client');

class ApiKeyModel {
  static async getKeysByUser(userId) {
    const { rows } = await pool.query(
      `SELECT id, name, key_prefix, is_active, request_count, last_used_at, created_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getActiveKeyCount(userId) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    return parseInt(rows[0].count);
  }

  static async createKey(id, userId, name, rawKey, keyPrefix) {
    const { rows } = await pool.query(
      `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, is_active)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, true)
       RETURNING id, name, key_prefix, created_at`,
      [id, userId, name, rawKey, keyPrefix]
    );
    return rows[0];
  }

  static async revokeKey(id, userId) {
    const { rows } = await pool.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows[0];
  }
}

module.exports = ApiKeyModel;
