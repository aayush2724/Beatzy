const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/UserModel');
const { createError } = require('../middleware/errorHandler');
const { logAudit } = require('../services/audit');
const { setCache, consumeCache } = require('../db/redis');
const logger = require('../utils/logger');

// How long the browser has to swap a Google sign-in code for tokens.
const OAUTH_CODE_TTL_SECONDS = 60;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// The cache key holds a hash of the code, so a Redis dump never reveals a
// code that is still redeemable.
function oauthCodeKey(code) {
  return `oauth:code:${hashToken(code)}`;
}

async function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  const refreshHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await UserModel.updateRefreshToken(userId, refreshHash, expiresAt);

  return { accessToken, refreshToken };
}

class AuthController {
  static async register(req, res) {
    const { name, email, password } = req.validated.body;
    
    const exists = await UserModel.existsByEmail(email);
    if (exists) throw createError(409, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.createUser(uuidv4(), name, email, passwordHash);
    
    const tokens = await generateTokens(user.id);
    await logAudit({ userId: user.id, action: 'user.register', ip: req.ip });
    logger.info('User registered', { userId: user.id, email });
    
    res.status(201).json({ success: true, data: { user, ...tokens } });
  }

  static async login(req, res) {
    const { email, password } = req.validated.body;
    
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password_hash) throw createError(401, 'Invalid credentials');
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw createError(401, 'Invalid credentials');
    
    if (!user.is_active) throw createError(403, 'Account deactivated');

    const tokens = await generateTokens(user.id);
    await UserModel.updateLastLogin(user.id);
    
    await logAudit({ userId: user.id, action: 'user.login', ip: req.ip });
    logger.info('User logged in', { userId: user.id });
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, is_admin: user.is_admin },
        ...tokens,
      },
    });
  }

  static async refresh(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError(400, 'Refresh token required');
    
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw createError(401, 'Invalid or expired refresh token');
    }

    const incomingHash = hashToken(refreshToken);
    const isValid = await UserModel.verifyRefreshToken(payload.sub, incomingHash);
    
    if (!isValid) {
      await UserModel.revokeRefreshToken(payload.sub);
      await logAudit({ userId: payload.sub, action: 'user.refresh_revoked', meta: { reason: 'token_reuse' } });
      throw createError(401, 'Refresh token revoked — please log in again');
    }

    const tokens = await generateTokens(payload.sub);
    res.json({ success: true, data: tokens });
  }

  static async getMe(req, res) {
    res.json({ success: true, data: { user: req.user } });
  }

  static async logout(req, res) {
    await UserModel.revokeRefreshToken(req.user.id);
    await logAudit({ userId: req.user.id, action: 'user.logout', ip: req.ip });
    res.json({ success: true, message: 'Logged out' });
  }

  static async googleCallback(req, res) {
    // Hand the browser a short-lived, single-use code rather than the tokens
    // themselves. Query strings end up in browser history, Referer headers and
    // request logs; the frontend redeems the code over POST instead.
    const code = crypto.randomBytes(32).toString('base64url');
    await setCache(oauthCodeKey(code), { userId: req.user.id }, OAUTH_CODE_TTL_SECONDS);
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/^["']|["']$/g, '');
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  static async googleExchange(req, res) {
    const { code } = req.validated.body;

    const entry = await consumeCache(oauthCodeKey(code));
    if (!entry) throw createError(401, 'Sign-in code is invalid or has expired — please try again');

    const user = await UserModel.findById(entry.userId);
    if (!user) throw createError(401, 'User not found');
    if (!user.is_active) throw createError(403, 'Account deactivated');

    const tokens = await generateTokens(user.id);
    await UserModel.updateLastLogin(user.id);

    await logAudit({ userId: user.id, action: 'user.login_google', ip: req.ip });
    logger.info('User logged in via Google', { userId: user.id });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, is_admin: user.is_admin },
        ...tokens,
      },
    });
  }
}

module.exports = { AuthController, generateTokens };
