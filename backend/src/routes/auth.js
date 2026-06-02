const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { logAudit } = require('../services/audit');
const logger = require('../utils/logger');

const router = express.Router();
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/^["']|["']$/g, '');
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').trim().replace(/^["']|["']$/g, '');

const googleOAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleOAuthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendUrl}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (rows[0]) return done(null, rows[0]);
      const { rows: newUser } = await pool.query(
        `INSERT INTO users (id, name, email, google_id, plan, is_active)
         VALUES ($1, $2, $3, $4, 'free', true) RETURNING *`,
        [uuidv4(), profile.displayName, email, profile.id]
      );
      done(null, newUser[0]);
    } catch (err) {
      done(err);
    }
  }));
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  // Persist hashed refresh token for rotation
  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    'UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3',
    [refreshHash, expiresAt, userId],
  );

  return { accessToken, refreshToken };
}

router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  const { name, email, password } = req.validated.body;
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing[0]) throw createError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, plan, is_active)
     VALUES ($1, $2, $3, $4, 'free', true) RETURNING id, name, email, plan, is_admin`,
    [uuidv4(), name, email, passwordHash]
  );
  const user = rows[0];
  const tokens = await generateTokens(user.id);
  await logAudit({ userId: user.id, action: 'user.register', ip: req.ip });
  logger.info('User registered', { userId: user.id, email });
  res.status(201).json({ success: true, data: { user, ...tokens } });
});

router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  const { email, password } = req.validated.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.password_hash) throw createError(401, 'Invalid credentials');
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw createError(401, 'Invalid credentials');
  if (!user.is_active) throw createError(403, 'Account deactivated');

  const tokens = await generateTokens(user.id);
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  await logAudit({ userId: user.id, action: 'user.login', ip: req.ip });
  logger.info('User logged in', { userId: user.id });
  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, is_admin: user.is_admin },
      ...tokens,
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError(400, 'Refresh token required');
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret');
  } catch {
    throw createError(401, 'Invalid or expired refresh token');
  }

  // Verify the token hash matches what's stored (rotation check)
  const incomingHash = hashToken(refreshToken);
  const { rows } = await pool.query(
    `SELECT id FROM users
     WHERE id = $1 AND is_active = true
       AND refresh_token_hash = $2
       AND refresh_token_expires_at > NOW()`,
    [payload.sub, incomingHash],
  );
  if (!rows[0]) {
    // Possible token reuse — revoke all sessions for safety
    await pool.query(
      'UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = $1',
      [payload.sub],
    );
    await logAudit({ userId: payload.sub, action: 'user.refresh_revoked', meta: { reason: 'token_reuse' } });
    throw createError(401, 'Refresh token revoked — please log in again');
  }

  // Rotate: issue new tokens and invalidate old hash
  const tokens = await generateTokens(payload.sub);
  res.json({ success: true, data: tokens });
});

router.get('/google', (req, res, next) => {
  if (!googleOAuthEnabled) {
    return res.status(503).json({ success: false, message: 'Google OAuth is not configured' });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleOAuthEnabled) {
    return res.status(503).json({ success: false, message: 'Google OAuth is not configured' });
  }
  return passport.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/auth/error` })(req, res, next);
}, async (req, res) => {
  const tokens = await generateTokens(req.user.id);
  await logAudit({ userId: req.user.id, action: 'user.login_google', ip: req.ip });
  res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

router.post('/logout', authenticate, async (req, res) => {
  // Invalidate refresh token
  await pool.query(
    'UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = $1',
    [req.user.id],
  );
  await logAudit({ userId: req.user.id, action: 'user.logout', ip: req.ip });
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;