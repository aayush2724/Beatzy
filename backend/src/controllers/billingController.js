const Stripe = require('stripe');
const BillingModel = require('../models/BillingModel');
const { createError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/^["']|["']$/g, '');

// Keep in step with PLAN_LIMITS in middleware/rateLimit.js and the Pricing page.
const PLANS = [
  { id: 'free', name: 'Free', price: 0, analysesPerMonth: 100, requestsPerDay: 500, features: ['100 analyses/mo', '500 API requests/day', '50 MB uploads', 'Web dashboard'] },
  { id: 'pro', name: 'Pro', price: 499, priceId: process.env.STRIPE_PRO_PRICE_ID, analysesPerMonth: 1000, requestsPerDay: 10000, features: ['1,000 analyses/mo', '10,000 API requests/day', '5 API keys', '100 MB uploads'] },
  { id: 'enterprise', name: 'Enterprise', price: 1999, priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, analysesPerMonth: -1, requestsPerDay: -1, features: ['Unlimited analyses', 'Unlimited API requests', '20 API keys', '500 MB uploads'] },
];

class BillingController {
  static async getPlans(req, res) {
    res.json({ success: true, data: PLANS });
  }

  static async subscribe(req, res) {
    const { planId } = req.body;
    const plan = PLANS.find(p => p.id === planId && p.price > 0);
    if (!plan) throw createError(400, 'Invalid plan');
    if (!plan.priceId || !process.env.STRIPE_SECRET_KEY) {
      throw createError(503, 'Billing is not configured on this server yet');
    }

    let customerId = await BillingModel.getStripeCustomerId(req.user.id);

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await BillingModel.updateStripeCustomerId(req.user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing`,
      metadata: { userId: req.user.id, planId },
    });

    res.json({ success: true, data: { url: session.url } });
  }

  static async getSubscription(req, res) {
    const user = await BillingModel.getSubscriptionDetails(req.user.id);
    let subscription = null;
    if (user?.subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(user.subscription_id);
      } catch (err) {
        logger.warn('Failed to retrieve stripe subscription', { error: err.message });
      }
    }
    res.json({ success: true, data: { plan: user?.plan || 'free', subscription } });
  }

  static async webhook(req, res) {
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
        await BillingModel.updateSubscriptionOnCheckout(userId, planId, session.subscription);
        logger.info('Subscription activated', { userId, planId });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await BillingModel.cancelSubscription(sub.id);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await BillingModel.markSubscriptionPastDue(invoice.subscription);
        break;
      }
    }

    res.json({ received: true });
  }

  static async portal(req, res) {
    const customerId = await BillingModel.getStripeCustomerId(req.user.id);
    if (!customerId) throw createError(400, 'No active subscription');
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/dashboard`,
    });
    
    res.json({ success: true, data: { url: session.url } });
  }
}

module.exports = { BillingController };
