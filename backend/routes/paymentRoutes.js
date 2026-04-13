const express = require('express');
const { createSubscription, handleWebhook, getSubscriptionStatus } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create subscription session
router.post('/create-subscription', authenticateToken, createSubscription);

// Get subscription status
router.get('/subscription-status', authenticateToken, getSubscriptionStatus);

// Stripe webhook (no auth needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;