const { pool } = require('../db/client');

class AudioModel {
  static async createJob({ id, userId, originalFilename, s3Key, s3Url, fileSize, mimeType, status }) {
    const { rows } = await pool.query(
      `INSERT INTO audio_jobs (id, user_id, original_filename, s3_key, s3_url, file_size, mime_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, status, created_at`,
      [id, userId, originalFilename, s3Key, s3Url, fileSize, mimeType, status]
    );
    return rows[0];
  }

  static async getJobById(jobId, userId) {
    const { rows } = await pool.query(
      `SELECT j.id, j.status, j.original_filename, j.created_at, j.completed_at, j.error_message,
              r.id as result_id
       FROM audio_jobs j
       LEFT JOIN analysis_results r ON r.job_id = j.id
       WHERE j.id = $1 AND j.user_id = $2`,
      [jobId, userId]
    );
    return rows[0];
  }

  static async getHistory({ userId, limit, offset, mood, bpmMin, bpmMax, key, search }) {
    const conditions = ['j.user_id = $1'];
    const params = [userId];
    let idx = 2;

    if (mood) {
      conditions.push(`r.mood = $${idx++}`);
      params.push(mood.toLowerCase());
    }
    if (bpmMin) {
      conditions.push(`r.bpm >= $${idx++}`);
      params.push(parseFloat(bpmMin));
    }
    if (bpmMax) {
      conditions.push(`r.bpm <= $${idx++}`);
      params.push(parseFloat(bpmMax));
    }
    if (key) {
      conditions.push(`r.key_signature ILIKE $${idx++}`);
      params.push(`%${key}%`);
    }
    if (search) {
      conditions.push(`(r.song_title ILIKE $${idx} OR r.song_artist ILIKE $${idx} OR j.original_filename ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.join(' AND ');

    const { rows } = await pool.query(
      `SELECT j.id, j.original_filename, j.status, j.created_at, j.completed_at,
              r.song_title, r.song_artist, r.bpm, r.mood, r.key_signature,
              r.energy_level, r.spotify_features
       FROM audio_jobs j
       LEFT JOIN analysis_results r ON r.job_id = j.id
       WHERE ${where}
       ORDER BY j.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM audio_jobs j
       LEFT JOIN analysis_results r ON r.job_id = j.id
       WHERE ${where}`,
      params
    );

    return { jobs: rows, total: parseInt(countRows[0].count) };
  }

  static async deleteJob(jobId, userId) {
    const { rows } = await pool.query(
      'DELETE FROM audio_jobs WHERE id = $1 AND user_id = $2 RETURNING id',
      [jobId, userId]
    );
    return rows[0];
  }
}

module.exports = AudioModel;
