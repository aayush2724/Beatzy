const express = require('express');
const { authenticate } = require('../middleware/auth');
const { UsersController } = require('../controllers/usersController');

const router = express.Router();

router.get('/me', authenticate, UsersController.getMe);
router.patch('/me', authenticate, UsersController.updateMe);
router.patch('/me/password', authenticate, UsersController.updatePassword);
router.get('/usage', authenticate, UsersController.getUsage);

module.exports = router;
