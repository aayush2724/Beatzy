const express = require('express');
const { authenticate } = require('../middleware/auth');
const { BillingController } = require('../controllers/billingController');

const router = express.Router();

router.get('/plans', BillingController.getPlans);
router.post('/subscribe', authenticate, BillingController.subscribe);
router.get('/subscription', authenticate, BillingController.getSubscription);
router.post('/webhook', express.raw({ type: 'application/json' }), BillingController.webhook);
router.post('/portal', authenticate, BillingController.portal);

module.exports = router;