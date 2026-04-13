require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./models/init');

// Create user_files directory if not exists
const userFilesDir = path.join(__dirname, '../user_files');
if (!fs.existsSync(userFilesDir)) {
  fs.mkdirSync(userFilesDir, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

// Initialize database on startup
try {
  initDatabase();
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/redirect', redirectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 QR Router Server Started!        ║
║   📍 Port: ${PORT}                         ║
║   🌐 URL: http://localhost:${PORT}    ║
║   💾 Database: SQLite                  ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
