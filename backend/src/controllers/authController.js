const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/UserModel');
const { createError } = require('../middleware/errorHandler');
const { logAudit } = require('../services/audit');
const logger = require('../utils/logger');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
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
    const tokens = await generateTokens(req.user.id);
    await logAudit({ userId: req.user.id, action: 'user.login_google', ip: req.ip });
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/^["']|["']$/g, '');
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  }
}

module.exports = { AuthController, generateTokens };
