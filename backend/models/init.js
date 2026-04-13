const db = require('../config/db-sqlite');
const bcrypt = require('bcryptjs');

// Create tables if they don't exist
const initDatabase = () => {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_end DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // QR Codes table
    db.exec(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        qr_code_slug VARCHAR(100) UNIQUE NOT NULL,
        redirect_urls TEXT NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        scans_count INTEGER DEFAULT 0
      );
    `);

    // Redirect logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS redirect_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        qr_code_id INTEGER NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
        user_agent VARCHAR(255),
        device_type VARCHAR(50),
        platform VARCHAR(50),
        redirect_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();
    if (userCount.count === 0) {
      const passwordHash = bcrypt.hashSync('123456', 10);
      db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
        .run('testuser', 'test@example.com', passwordHash);
      console.log('✅ Test user created: test@example.com / 123456');
    }

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initDatabase };

