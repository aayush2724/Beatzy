const express = require('express');
const Stripe = require('stripe');
const { authenticate } = require('../middleware/auth');
const { pool } = require('../db/client');
const { createError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = [
  { id: 'free', name: 'Free', price: 0, requests: 100, features: ['100 analyses/mo', 'Basic insights', 'Web dashboard'] },
  { id: 'pro', name: 'Pro', price: 1900, priceId: process.env.STRIPE_PRO_PRICE_ID, requests: 5000, features: ['5,000 analyses/mo', 'Full AI insights', 'API access', '5 API keys'] },
  { id: 'enterprise', name: 'Enterprise', price: 9900, priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, requests: -1, features: ['Unlimited analyses', 'Priority processing', '20 API keys', 'SLA support'] },
];

router.get('/plans', (req, res) => {
  res.json({ success: true, data: PLANS });
});

router.post('/subscribe', authenticate, async (req, res) => {
  const { planId } = req.body;
  const plan = PLANS.find(p => p.id === planId && p.price > 0);
  if (!plan) throw createError(400, 'Invalid plan');

  const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
  let customerId = rows[0]?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      metadata: { userId: req.user.id },
    });
    customerId = customer.id;
    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId: req.user.id, planId },
  });

  res.json({ success: true, data: { url: session.url } });
});

router.get('/subscription', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT plan, stripe_customer_id, subscription_id, subscription_status FROM users WHERE id = $1',
    [req.user.id]
  );
  const user = rows[0];
  let subscription = null;
  if (user.subscription_id) {
    try {
      subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    } catch {}
  }
  res.json({ success: true, data: { plan: user.plan, subscription } });
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('Stripe webhook signature failed', { error: err.message });
    return res.status(400).json({ error: 'Invalid signature' });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, planId } = session.metadata;
      await pool.query(
        'UPDATE users SET plan = $1, subscription_id = $2, subscription_status = $3 WHERE id = $4',
        [planId, session.subscription, 'active', userId]
      );
      logger.info('Subscription activated', { userId, planId });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await pool.query(
        "UPDATE users SET plan = 'free', subscription_status = 'cancelled' WHERE subscription_id = $1",
        [sub.id]
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await pool.query(
        "UPDATE users SET subscription_status = 'past_due' WHERE subscription_id = $1",
        [invoice.subscription]
      );
      break;
    }
  }

  res.json({ received: true });
});

router.post('/portal', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]?.stripe_customer_id) throw createError(400, 'No active subscription');
  const session = await stripe.billingPortal.sessions.create({
    customer: rows[0].stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });
  res.json({ success: true, data: { url: session.url } });
});

module.exports = router;
