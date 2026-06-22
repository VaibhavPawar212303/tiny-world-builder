// Backend: User signup endpoint - TiDB integration
import crypto from 'crypto';

const { query } = require('../lib/db');
const { initializeDatabase } = require('../lib/db-init');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'salt').digest('hex');
}

function generateToken() {
  return 'auth_' + crypto.randomBytes(32).toString('hex');
}

function generateUserId() {
  return 'user_' + crypto.randomBytes(8).toString('hex');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database schema
    await initializeDatabase();

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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), userId, token, expiresAt, now]
    );

    console.log('[AUTH] ✓ Session created in TiDB');

    // Return user data (without password)
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

    // Check for specific database errors
    if (error.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (error.message.includes('Connection')) {
      return res.status(503).json({ error: 'Database connection failed' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
