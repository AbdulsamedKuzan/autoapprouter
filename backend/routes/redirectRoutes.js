const express = require('express');
const { handleRedirect, getQRAnalytics } = require('../controllers/redirectController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public redirect route (no auth required)
router.get('/:slug', handleRedirect);

// Analytics route (requires auth)
router.get('/analytics/:slug', authMiddleware, getQRAnalytics);

module.exports = router;
