// Consolidated Auth Endpoint - Handles login, signup, and logout
import crypto from 'crypto';

const { query } = require('./lib/db');
const { initializeDatabase } = require('./lib/db-init');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'salt').digest('hex');
}

function generateToken() {
  return 'auth_' + crypto.randomBytes(32).toString('hex');
}

function generateUserId() {
  return 'user_' + crypto.randomBytes(8).toString('hex');
}

async function handleSignup(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const userId = generateUserId();
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    await query(
      'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, now, now]
    );

    console.log('[AUTH] ✓ User created in TiDB:', email);

    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, token, expiresAt, now]
    );

    return res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        created_at: now
      }
    });

  } catch (error) {
    console.error('[API] Signup error:', error);

    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (error.message.includes('Connection')) {
      return res.status(503).json({ error: 'Database connection failed' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Query user from TiDB
    const users = await query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    // Verify password
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('[AUTH] ✓ User login verified:', email);

    // Generate session token
    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), user.id, token, expiresAt, now]
    );

    console.log('[AUTH] ✓ Session created in TiDB');

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('[API] Login error:', error);

    if (error.message.includes('Connection')) {
      return res.status(503).json({ error: 'Database connection failed' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleLogout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Invalidate session in TiDB
    const result = await query('DELETE FROM sessions WHERE token = ?', [token]);

    if (result.affectedRows === 0) {
      console.warn('[AUTH] Token not found for logout:', token.substring(0, 20));
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('[AUTH] ✓ User session terminated');

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('[API] Logout error:', error);

    if (error.message.includes('Connection')) {
      return res.status(503).json({ error: 'Database connection failed' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database schema
    await initializeDatabase();

    // Route based on action parameter or path
    const action = req.query.action || req.body.action;

    switch (action) {
      case 'signup':
        return handleSignup(req, res);
      case 'login':
        return handleLogin(req, res);
      case 'logout':
        return handleLogout(req, res);
      default:
        // Try to auto-detect based on request body
        if (req.body.name) {
          return handleSignup(req, res);
        } else {
          return handleLogin(req, res);
        }
    }

  } catch (error) {
    console.error('[API] Auth handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
