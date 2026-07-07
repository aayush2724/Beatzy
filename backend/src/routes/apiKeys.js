const express = require('express');
const { authenticate, requirePlan } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { ApiKeysController } = require('../controllers/apiKeysController');

const router = express.Router();

router.get('/', authenticate, ApiKeysController.getKeys);
router.post('/', authenticate, requirePlan('pro', 'enterprise'), validate(schemas.createApiKey), ApiKeysController.createKey);
router.delete('/:id', authenticate, ApiKeysController.revokeKey);

module.exports = router;
