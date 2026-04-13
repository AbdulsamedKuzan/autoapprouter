const Stripe = require('stripe');
const db = require('../config/db-sqlite');

let stripeClient = null;
const getStripe = () => {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = Stripe(key);
  }
  return stripeClient;
};

// Create subscription session
const createSubscription = async (req, res) => {
  try {
    const { priceId } = req.body; // Stripe price ID for yearly subscription
    const userId = req.user.id;

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
      client_reference_id: userId.toString(),
      metadata: {
        userId: userId.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message || 'Error creating subscription' });
  }
};

// Handle Stripe webhooks
const handleWebhook = async (req, res) => {
  try {
    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;

        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

        const stmt = db.prepare(
          'UPDATE users SET subscription_plan = ?, subscription_end = ? WHERE id = ?'
        );
        stmt.run('premium', endDate.toISOString(), userId);
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment for recurring subscription
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send(error.message || 'Webhook handling error');
  }
};

// Get subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const stmt = db.prepare('SELECT subscription_plan, subscription_end FROM users WHERE id = ?');
    const user = stmt.get(userId);

    const now = new Date();
    const isActive = user.subscription_end && new Date(user.subscription_end) > now;

    res.json({
      plan: user.subscription_plan || 'free',
      isActive,
      endDate: user.subscription_end
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Error getting subscription status' });
  }
};

module.exports = { createSubscription, handleWebhook, getSubscriptionStatus };