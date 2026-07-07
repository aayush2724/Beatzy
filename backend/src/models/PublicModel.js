const { pool } = require('../db/client');

class PublicModel {
  static async getSharedResult(shareToken) {
    const { rows } = await pool.query(
      `SELECT r.job_id, r.song_title, r.song_artist, r.song_album, r.bpm, r.energy_level,
              r.mood, r.key_signature, r.scale, r.chords, r.spotify_features,
              j.share_token, j.completed_at
       FROM analysis_results r
       JOIN audio_jobs j ON j.id = r.job_id
       WHERE j.share_token = $1 AND j.is_public = true AND j.status = 'completed'`,
      [shareToken]
    );
    return rows[0];
  }

  static async checkDatabase() {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = PublicModel;
