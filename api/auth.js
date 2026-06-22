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

    // Check if tables exist before creating
    const checkUsers = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`;
    const [usersExists] = await pool.execute(checkUsers);

    if (usersExists.length > 0) {
      console.log('[DB-INIT] Users and sessions tables already exist');
      return true;
    }

    // Create users table - simple schema without foreign key references
    const createUsersTable = `
      CREATE TABLE users (
        id VARCHAR(40) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE KEY,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.execute(createUsersTable);
    console.log('[DB-INIT] Users table created');

    // Create sessions table - simple schema, no foreign key for now
    const createSessionsTable = `
      CREATE TABLE sessions (
        id VARCHAR(40) PRIMARY KEY,
        user_id VARCHAR(40) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE KEY,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.execute(createSessionsTable);
    console.log('[DB-INIT] Sessions table created');
    return true;

  } catch (error) {
    console.error('[DB-INIT] Error:', error.message);
    throw error;
  }
}

// Use a fixed salt for demo - in production use bcrypt or argon2
const FIXED_SALT = 'tinyworld-auth-salt-2024';

function hashPassword(password) {
  // Simple hash for demo - in production use bcrypt
  return crypto.createHash('sha256').update(password + FIXED_SALT).digest('hex');
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

    console.log('[AUTH] Login attempt for:', email);

    const users = await query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?', [email]);
    const passwordHash = hashPassword(password);

    let user = null;

    if (users.length === 0) {
      // Auto-create user on first login (demo mode)
      console.log('[AUTH] User not found, creating new user');
      const userId = generateUserId();
      const now = new Date().toISOString();
      const displayName = email.split('@')[0];

      await query(
        'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, displayName, email, passwordHash, now, now]
      );

      user = {
        id: userId,
        name: displayName,
        email: email,
        created_at: now
      };

      console.log('[AUTH] New user created:', email);
    } else {
      user = users[0];
      console.log('[AUTH] User found, checking password');

      if (user.password_hash !== passwordHash) {
        console.log('[AUTH] Password mismatch');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      console.log('[AUTH] Password verified');
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
