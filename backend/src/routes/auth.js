const express = require('express');
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
const logger = require('../utils/logger');

const router = express.Router();

const googleOAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleOAuthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`,
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

function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  const { name, email, password } = req.validated.body;
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing[0]) throw createError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (id, name, email, password_hash, plan, is_active)
     VALUES ($1, $2, $3, $4, 'free', true) RETURNING id, name, email, plan`,
    [uuidv4(), name, email, passwordHash]
  );
  const user = rows[0];
  const tokens = generateTokens(user.id);
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

  const tokens = generateTokens(user.id);
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  logger.info('User logged in', { userId: user.id });
  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      ...tokens,
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError(400, 'Refresh token required');
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw createError(401, 'Invalid or expired refresh token');
  }
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 AND is_active = true', [payload.sub]);
  if (!rows[0]) throw createError(401, 'User not found');
  const tokens = generateTokens(payload.sub);
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
  return passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/error` })(req, res, next);
}, (req, res) => {
  const tokens = generateTokens(req.user.id);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
