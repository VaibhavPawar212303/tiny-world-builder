// Consolidated Auth Endpoint - Handles login, signup, and logout
import crypto from 'crypto';
import mysql from 'mysql2/promise';

let pool = null;

async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    // Use DATABASE_URL if available
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: 'Amazon RDS',
        authPlugins: {
          mysql_native_password: () => () => process.env.DB_PASSWORD,
        },
      });
    }
    return pool;
  } catch (err) {
    console.error('[DB] Failed to create pool:', err.message);
    throw err;
  }
}

async function query(sql, values) {
  try {
    const pool = await getPool();
    const [result] = await pool.execute(sql, values);
    return result;
  } catch (err) {
    console.error('[DB] Query failed:', err.message);
    throw err;
  }
}

async function initializeDatabase() {
  try {
    const pool = await getPool();

    // Drop sessions table first if it exists (to avoid foreign key issues)
    try {
      await pool.execute('DROP TABLE IF EXISTS sessions');
    } catch (e) {
      // Ignore drop errors
    }

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createUsersTable);
    console.log('[DB-INIT] Users table ready');

    // Create sessions table with proper charset matching
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        user_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createSessionsTable);
    console.log('[DB-INIT] Sessions table ready');
    return true;

  } catch (error) {
    console.error('[DB-INIT] Error:', error.message);
    throw error;
  }
}

function hashPassword(password) {
  const salt = process.env.PASSWORD_SALT || 'default-salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
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

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userId = generateUserId();
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    await query(
      'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email, passwordHash, now, now]
    );

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

    if (error.message.includes('Connection') || error.message.includes('ENOTFOUND')) {
      return res.status(503).json({ error: 'Database connection failed: ' + error.message });
    }

    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const users = await query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), user.id, token, expiresAt, now]
    );

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

    if (error.message.includes('Connection') || error.message.includes('ENOTFOUND')) {
      return res.status(503).json({ error: 'Database connection failed: ' + error.message });
    }

    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

async function handleLogout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const result = await query('DELETE FROM sessions WHERE token = ?', [token]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('[API] Logout error:', error);

    if (error.message.includes('Connection') || error.message.includes('ENOTFOUND')) {
      return res.status(503).json({ error: 'Database connection failed: ' + error.message });
    }

    return res.status(500).json({ error: 'Internal server error: ' + error.message });
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
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
