// Backend: User login endpoint - TiDB integration
import crypto from 'crypto';

const { query } = require('../lib/db');
const { initializeDatabase } = require('../lib/db-init');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'salt').digest('hex');
}

function generateToken() {
  return 'auth_' + crypto.randomBytes(32).toString('hex');
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
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), user.id, token, expiresAt, now]
    );

    console.log('[AUTH] ✓ Session created in TiDB');

    // Return user data
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
