const { pool } = require('../db/client');

class LibraryModel {
  static async getFavorites(userId) {
    const { rows } = await pool.query(
      `SELECT j.id, j.status, j.created_at, r.song_title, r.song_artist, r.bpm, r.mood, r.spotify_features
       FROM job_favorites f
       JOIN audio_jobs j ON j.id = f.job_id
       LEFT JOIN analysis_results r ON r.job_id = j.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async getJobById(jobId, userId) {
    const { rows } = await pool.query(
      'SELECT id FROM audio_jobs WHERE id = $1 AND user_id = $2',
      [jobId, userId]
    );
    return rows[0];
  }

  static async addFavorite(userId, jobId) {
    await pool.query(
      `INSERT INTO job_favorites (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, jobId]
    );
  }

  static async removeFavorite(userId, jobId) {
    await pool.query('DELETE FROM job_favorites WHERE user_id = $1 AND job_id = $2', [userId, jobId]);
  }

  static async getCollections(userId) {
    const { rows } = await pool.query(
      `SELECT c.*, COUNT(ci.job_id)::int AS item_count
       FROM collections c
       LEFT JOIN collection_items ci ON ci.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async createCollection(id, userId, name) {
    const { rows } = await pool.query(
      `INSERT INTO collections (id, user_id, name) VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, name]
    );
    return rows[0];
  }

  static async getCollectionById(collectionId, userId) {
    const { rows } = await pool.query(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [collectionId, userId]
    );
    return rows[0];
  }

  static async addToCollection(collectionId, jobId) {
    await pool.query(
      `INSERT INTO collection_items (collection_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [collectionId, jobId]
    );
    await pool.query('UPDATE collections SET updated_at = NOW() WHERE id = $1', [collectionId]);
  }

  static async getCompletedJob(jobId, userId) {
    const { rows } = await pool.query(
      `SELECT id, share_token, is_public FROM audio_jobs WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
      [jobId, userId]
    );
    return rows[0];
  }

  static async enableShare(jobId, shareToken) {
    await pool.query(
      'UPDATE audio_jobs SET share_token = $1, is_public = true WHERE id = $2',
      [shareToken, jobId]
    );
  }

  static async updatePublicStatus(jobId, isPublic, userId) {
    if (userId) {
      await pool.query(
        'UPDATE audio_jobs SET is_public = $1 WHERE id = $2 AND user_id = $3',
        [isPublic, jobId, userId]
      );
    } else {
      await pool.query('UPDATE audio_jobs SET is_public = $1 WHERE id = $2', [isPublic, jobId]);
    }
  }
}

module.exports = LibraryModel;
