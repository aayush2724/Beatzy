const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requirePlan } = require('../middleware/auth');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validate');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name, key_prefix, is_active, request_count, last_used_at, created_at
     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows });
});

router.post('/', authenticate, requirePlan('pro', 'enterprise'), validate(schemas.createApiKey), async (req, res) => {
  const { rows: existing } = await pool.query(
    'SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND is_active = true',
    [req.user.id]
  );
  const maxKeys = req.user.plan === 'enterprise' ? 20 : 5;
  if (parseInt(existing[0].count) >= maxKeys) {
    throw createError(429, `Maximum of ${maxKeys} active API keys for your plan`);
  }

  const rawKey = `bz_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 10);

  const { rows } = await pool.query(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, is_active)
     VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, true)
     RETURNING id, name, key_prefix, created_at`,
    [uuidv4(), req.user.id, req.validated.body.name, rawKey, keyPrefix]
  );

  res.status(201).json({
    success: true,
    data: {
      ...rows[0],
      key: rawKey,
      warning: 'Store this key securely. It will not be shown again.',
    },
  });
});

router.delete('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!rows[0]) throw createError(404, 'API key not found');
  res.json({ success: true, message: 'API key revoked' });
});

module.exports = router;
