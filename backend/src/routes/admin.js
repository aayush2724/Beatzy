const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { AdminController } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.patch('/users/:id', AdminController.updateUser);
router.get('/stats', AdminController.getStats);
router.get('/audit-log', AdminController.getAuditLogs);

module.exports = router;