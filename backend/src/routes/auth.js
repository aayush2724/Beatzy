const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { v4: uuidv4 } = require('uuid');

const { AuthController } = require('../controllers/authController');
const UserModel = require('../models/UserModel');
const { authLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

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
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false, { message: 'No email found in Google profile' });

      let user = await UserModel.findByEmail(email);
      
      if (user) {
        if (!user.google_id) {
          await UserModel.updateGoogleId(user.id, profile.id);
        }
        return done(null, user);
      }

      user = await UserModel.createGoogleUser(
        uuidv4(), 
        profile.displayName || profile.name?.givenName || 'Google User', 
        email, 
        profile.id
      );
      done(null, user);
    } catch (err) {
      done(err);
    }
  }));
}

router.post('/register', authLimiter, validate(schemas.register), AuthController.register);
router.post('/login', authLimiter, validate(schemas.login), AuthController.login);
router.post('/refresh', authLimiter, AuthController.refresh);

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
}, AuthController.googleCallback);

router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;