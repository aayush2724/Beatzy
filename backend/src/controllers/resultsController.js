const ResultsModel = require('../models/ResultsModel');
const { getCache, setCache } = require('../db/redis');
const { createError } = require('../middleware/errorHandler');
const { getPresignedUrl } = require('../services/storage');

class ResultsController {
  static async getRecentResults(req, res) {
    const results = await ResultsModel.getRecentResults(req.user.id);
    res.json({ success: true, data: results });
  }

  static async exportResult(req, res) {
    const result = await ResultsModel.getResultForExport(req.params.jobId, req.user.id);
    if (!result) throw createError(404, 'Results not found');

    const report = {
      exported_at: new Date().toISOString(),
      job_id: result.job_id,
      song: {
        title: result.song_title,
        artist: result.song_artist,
        album: result.song_album,
      },
      audio: {
        bpm: result.bpm,
        key: result.key_signature,
        scale: result.scale,
        mood: result.mood,
        energy: result.energy_level,
        time_signature: result.time_signature,
      },
      chords: result.chords,
      spotify: result.spotify_features,
      lyrics: result.lyrics,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="beatzy-report-${req.params.jobId.slice(0, 8)}.json"`);
    res.send(JSON.stringify(report, null, 2));
  }

  static async getResult(req, res) {
    const cacheKey = `result:${req.params.jobId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, status: 'complete', data: cached, cached: true });

    const job = await ResultsModel.getJobWithResult(req.params.jobId, req.user.id);
    if (!job) {
      throw createError(404, 'Job not found');
    }

    if (job.status === 'queued' || job.status === 'processing') {
      return res.status(202).json({
        success: true,
        status: 'processing',
        jobId: req.params.jobId,
        progress: { percent: job.progress || 10 },
        message: 'Analysis in progress'
      });
    }

    if (job.status === 'failed') {
      return res.json({
        success: true,
        status: 'failed',
        error: job.error_message || 'Analysis failed'
      });
    }

    // If status is completed but no result record yet (rare race condition)
    if (!job.id && job.status === 'completed') {
      return res.status(202).json({
        success: true,
        status: 'processing',
        jobId: req.params.jobId,
        message: 'Finalizing results'
      });
    }

    const result = { ...job };
    if (result.s3_key) {
      try {
        result.audio_url = await getPresignedUrl(result.s3_key);
      } catch {
        result.audio_url = null;
      }
    }
    delete result.s3_key;

    await setCache(cacheKey, result, 3600);
    res.json({ success: true, status: 'complete', data: result });
  }
}

module.exports = { ResultsController };
