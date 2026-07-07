const { pool } = require('../db/client');

class ResultsModel {
  static async getRecentResults(userId) {
    const { rows } = await pool.query(
      `SELECT r.job_id, r.song_title, r.song_artist, r.song_album, r.bpm, r.energy_level,
              r.mood, r.key_signature, r.time_signature, r.created_at,
              j.original_filename
       FROM analysis_results r
       JOIN audio_jobs j ON j.id = r.job_id
       WHERE j.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [userId]
    );
    return rows;
  }

  static async getResultForExport(jobId, userId) {
    const { rows } = await pool.query(
      `SELECT r.*, j.original_filename, j.created_at as job_created_at
       FROM analysis_results r
       JOIN audio_jobs j ON j.id = r.job_id
       WHERE r.job_id = $1 AND j.user_id = $2`,
      [jobId, userId]
    );
    return rows[0];
  }

  static async getJobWithResult(jobId, userId) {
    const { rows } = await pool.query(
      `SELECT r.*, j.original_filename, j.s3_key, j.created_at as job_created_at, j.status, j.error_message, j.progress, j.id as job_id
       FROM audio_jobs j
       LEFT JOIN analysis_results r ON r.job_id = j.id
       WHERE j.id = $1 AND j.user_id = $2`,
      [jobId, userId]
    );
    return rows[0];
  }
}

module.exports = ResultsModel;
