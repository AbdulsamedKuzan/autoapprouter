const express = require('express');
const { createQRCode, getUserQRCodes, deleteQRCode } = require('../controllers/qrController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// QR Code routes
router.post('/create', createQRCode);
router.get('/list', getUserQRCodes);
router.delete('/:id', deleteQRCode);

module.exports = router;
