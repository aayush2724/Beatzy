const { pool } = require('../db/client');

class BillingModel {
  static async getStripeCustomerId(userId) {
    const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
    return rows[0]?.stripe_customer_id;
  }

  static async updateStripeCustomerId(userId, customerId) {
    await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
  }

  static async getSubscriptionDetails(userId) {
    const { rows } = await pool.query(
      'SELECT plan, stripe_customer_id, subscription_id, subscription_status FROM users WHERE id = $1',
      [userId]
    );
    return rows[0];
  }

  static async updateSubscriptionOnCheckout(userId, planId, subscriptionId) {
    await pool.query(
      'UPDATE users SET plan = $1, subscription_id = $2, subscription_status = $3 WHERE id = $4',
      [planId, subscriptionId, 'active', userId]
    );
  }

  static async cancelSubscription(subscriptionId) {
    await pool.query(
      "UPDATE users SET plan = 'free', subscription_status = 'cancelled' WHERE subscription_id = $1",
      [subscriptionId]
    );
  }

  static async markSubscriptionPastDue(subscriptionId) {
    await pool.query(
      "UPDATE users SET subscription_status = 'past_due' WHERE subscription_id = $1",
      [subscriptionId]
    );
  }
}

module.exports = BillingModel;
