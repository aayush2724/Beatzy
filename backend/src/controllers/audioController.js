const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { URL } = require('url');
const fs = require('fs');
const pathMod = require('path');
const AudioModel = require('../models/AudioModel');
const { createError } = require('../middleware/errorHandler');
const { uploadToS3 } = require('../services/storage');
const { enqueueAnalysisJob } = require('../services/queue');
const { PLAN_LIMITS } = require('../middleware/rateLimit');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || '/tmp/beatzy-audio';

const ALLOWED_AUDIO_HOSTS = [
  'open.spotify.com',
  'i.scdn.co',
  'audio-ak-spotify-com.akamaized.net',
  'files.freemusicarchive.org',
  'soundcloud.com',
  'sndcdn.com',
  'itunes.apple.com',
  'audio.itunes.apple.com',
];

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^localhost$/i,
];

function isUrlSafe(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (PRIVATE_IP_RANGES.some(re => re.test(parsed.hostname))) return false;
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_AUDIO_HOSTS.some(h => host === h || host.endsWith('.' + h))) return true;
    return false;
  } catch {
    return false;
  }
}

const AUDIO_MIME_MAP = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.webm': 'audio/webm',
};

class AudioController {
  static async upload(req, res) {
    if (!req.file) throw createError(400, 'No audio file provided');

    const plan = req.user.plan || 'free';
    const maxSize = PLAN_LIMITS[plan].uploadSizeMB * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw createError(413, `File exceeds ${PLAN_LIMITS[plan].uploadSizeMB}MB limit for your plan`);
    }

    const jobId = uuidv4();
    const s3Key = `audio/${req.user.id}/${jobId}/${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);

    const job = await AudioModel.createJob({
      id: jobId,
      userId: req.user.id,
      originalFilename: req.file.originalname,
      s3Key,
      s3Url,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'queued'
    });

    await enqueueAnalysisJob({
      jobId,
      userId: req.user.id,
      s3Key,
      s3Url,
      originalFilename: req.file.originalname,
    });

    logger.info('Audio job queued', { jobId, userId: req.user.id });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        createdAt: job.created_at,
        message: 'Audio uploaded and queued for analysis',
      },
    });
  }

  static async uploadBatch(req, res) {
    const files = req.files || [];
    if (!files.length) throw createError(400, 'No audio files provided');

    const plan = req.user.plan || 'free';
    const batchLimit = PLAN_LIMITS[plan].batchSize || 1;
    if (files.length > batchLimit) {
      throw createError(413, `Batch limit is ${batchLimit} files for your plan`);
    }

    const jobs = [];
    for (const file of files) {
      const maxSize = PLAN_LIMITS[plan].uploadSizeMB * 1024 * 1024;
      if (file.size > maxSize) continue;

      const jobId = uuidv4();
      const s3Key = `audio/${req.user.id}/${jobId}/${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const s3Url = await uploadToS3(file.buffer, s3Key, file.mimetype);

      const job = await AudioModel.createJob({
        id: jobId,
        userId: req.user.id,
        originalFilename: file.originalname,
        s3Key,
        s3Url,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'queued'
      });

      await enqueueAnalysisJob({
        jobId,
        userId: req.user.id,
        s3Key,
        s3Url,
        originalFilename: file.originalname,
      });

      jobs.push({ jobId: job.id, status: job.status, filename: file.originalname });
    }

    res.status(202).json({ success: true, data: { jobs, count: jobs.length } });
  }

  static async search(req, res) {
    const { q, limit } = req.query;
    if (!q) throw createError(400, 'Query parameter "q" is required');

    try {
      try {
        const { data } = await axios.get(`${ML_SERVICE_URL}/spotify/search`, {
          params: { q, limit: limit || 10 },
          timeout: 15000,
        });
        if (data?.data?.length) {
          return res.json(data);
        }
      } catch (mlErr) {
        logger.warn('ML service search failed, falling back to iTunes', { error: mlErr.message });
      }

      const itunesResponse = await axios.get('https://itunes.apple.com/search', {
        params: { term: q, entity: 'song', limit: limit || 10 },
        timeout: 10000,
      });

      const tracks = (itunesResponse.data.results || [])
        .filter((item) => item.wrapperType === 'track')
        .map((track) => ({
          spotify_id: String(track.trackId),
          title: track.trackName,
          artist: track.artistName,
          album: track.collectionName,
          cover_url: (track.artworkUrl100 || '').replace('100x100', '600x600'),
          preview_url: track.previewUrl,
          duration_ms: track.trackTimeMillis,
          source: 'itunes',
        }));

      return res.json({ success: true, data: tracks });
    } catch (err) {
      logger.error('Song search failed', { error: err.message });
      throw createError(502, 'Song search service unavailable');
    }
  }

  static async analyzeUrl(req, res) {
    const { url, title, artist } = req.body;
    if (!url) throw createError(400, 'Field "url" is required');

    if (!isUrlSafe(url)) {
      throw createError(400, 'URL not allowed. Only public audio CDN URLs are accepted.');
    }

    let audioBuffer;
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
      });
      audioBuffer = Buffer.from(response.data);
    } catch (err) {
      logger.error('Failed to download remote audio', { url, error: err.message });
      throw createError(502, 'Could not download audio from the provided URL');
    }

    const jobId = uuidv4();
    const safeTitle = (title || 'preview').replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const safeArtist = (artist || '').replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const filename = safeArtist
      ? `${safeArtist} - ${safeTitle}.mp3`
      : `${safeTitle.replace(/\s+/g, '_')}.mp3`;
    const s3Key = `audio/${req.user.id}/${jobId}/${filename.replace(/[^a-zA-Z0-9._ -]/g, '_')}`;

    const s3Url = await uploadToS3(audioBuffer, s3Key, 'audio/mpeg');

    const job = await AudioModel.createJob({
      id: jobId,
      userId: req.user.id,
      originalFilename: filename,
      s3Key,
      s3Url,
      fileSize: audioBuffer.length,
      mimeType: 'audio/mpeg',
      status: 'queued'
    });

    await enqueueAnalysisJob({
      jobId,
      userId: req.user.id,
      s3Key,
      s3Url,
      originalFilename: filename,
    });

    logger.info('Remote audio job queued', { jobId, userId: req.user.id, title, artist });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        createdAt: job.created_at,
        message: 'Audio downloaded and queued for analysis',
      },
    });
  }

  static async getJob(req, res) {
    const job = await AudioModel.getJobById(req.params.jobId, req.user.id);
    if (!job) throw createError(404, 'Job not found');
    res.json({ success: true, data: job });
  }

  static async getHistory(req, res) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { mood, bpm_min, bpm_max, key, search } = req.query;

    const { jobs, total } = await AudioModel.getHistory({
      userId: req.user.id,
      limit,
      offset,
      mood,
      bpmMin: bpm_min,
      bpmMax: bpm_max,
      key,
      search
    });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }

  static async deleteJob(req, res) {
    const deleted = await AudioModel.deleteJob(req.params.jobId, req.user.id);
    if (!deleted) throw createError(404, 'Job not found');
    res.json({ success: true, message: 'Job deleted' });
  }

  static async getFile(req, res) {
    const key = decodeURIComponent(req.params.encodedKey);
    const fullPath = pathMod.join(LOCAL_STORAGE_DIR, key);

    if (!fullPath.startsWith(LOCAL_STORAGE_DIR)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: { message: 'File not found' } });
    }

    const ext = pathMod.extname(fullPath).toLowerCase();
    const contentType = AUDIO_MIME_MAP[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(fullPath).pipe(res);
  }
}

module.exports = { AudioController };
