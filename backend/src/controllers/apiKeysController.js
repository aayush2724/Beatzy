const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const ApiKeyModel = require('../models/ApiKeyModel');
const { createError } = require('../middleware/errorHandler');

class ApiKeysController {
  static async getKeys(req, res) {
    const keys = await ApiKeyModel.getKeysByUser(req.user.id);
    res.json({ success: true, data: keys });
  }

  static async createKey(req, res) {
    const activeCount = await ApiKeyModel.getActiveKeyCount(req.user.id);
    const maxKeys = req.user.plan === 'enterprise' ? 20 : 5;
    
    if (activeCount >= maxKeys) {
      throw createError(429, `Maximum of ${maxKeys} active API keys for your plan`);
    }

    const rawKey = `bz_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.slice(0, 10);

    const newKey = await ApiKeyModel.createKey(
      uuidv4(),
      req.user.id,
      req.validated.body.name,
      rawKey,
      keyPrefix
    );

    res.status(201).json({
      success: true,
      data: {
        ...newKey,
        key: rawKey,
        warning: 'Store this key securely. It will not be shown again.',
      },
    });
  }

  static async revokeKey(req, res) {
    const revoked = await ApiKeyModel.revokeKey(req.params.id, req.user.id);
    if (!revoked) throw createError(404, 'API key not found');
    
    res.json({ success: true, message: 'API key revoked' });
  }
}

module.exports = { ApiKeysController };
