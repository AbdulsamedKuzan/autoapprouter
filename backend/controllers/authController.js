const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db-sqlite');

// Register user
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, email, hashedPassword);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: result.lastInsertRowid, username, email }
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Get current authenticated user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const stmt = db.prepare('SELECT id, username, email, subscription_plan, subscription_end FROM users WHERE id = ?');
    const user = stmt.get(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      subscription_plan: user.subscription_plan || 'free',
      subscription_end: user.subscription_end
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error fetching user info' });
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };
