const axios = require('axios');
const PublicModel = require('../models/PublicModel');
const { createError } = require('../middleware/errorHandler');

class PublicController {
  static async getSharedResult(req, res) {
    const result = await PublicModel.getSharedResult(req.params.shareToken);
    if (!result) throw createError(404, 'Shared result not found or not public');
    res.json({ success: true, data: result });
  }

  static async getStatus(req, res) {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const checks = { backend: 'ok', database: 'unknown', redis: 'unknown', ml: 'unknown' };

    const dbOk = await PublicModel.checkDatabase();
    checks.database = dbOk ? 'ok' : 'error';

    try {
      const { redisAvailable } = require('../db/redis');
      checks.redis = redisAvailable ? 'ok' : 'unavailable';
    } catch {
      checks.redis = 'error';
    }

    try {
      const { data } = await axios.get(`${mlUrl}/health`, { timeout: 8000 });
      checks.ml = data?.status === 'ok' ? 'ok' : 'degraded';
      checks.ml_storage = data?.storage?.reachable ?? null;
    } catch {
      checks.ml = 'error';
    }

    const overall = Object.values(checks).every((v) => v === 'ok' || v === 'unavailable') ? 'operational' : 'degraded';
    res.json({ success: true, data: { status: overall, checks, timestamp: new Date().toISOString() } });
  }
}

module.exports = { PublicController };
