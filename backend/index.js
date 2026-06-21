import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { v4 as uuid } from 'uuid';
import * as jose from 'jose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection pool
let pool;

async function initDatabase() {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Verify Clerk JWT token
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.CLERK_SECRET_KEY);
    const verified = await jose.jwtVerify(token, secret);
    return verified.payload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

// Middleware to extract and verify user
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
});

// ====== USER ENDPOINTS ======

// Get or create user
app.post('/api/users/sync', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { email, username, displayName, avatarUrl } = req.body;
    const userId = req.user.sub;

    const conn = await pool.getConnection();

    // Check if user exists
    const [existing] = await conn.query('SELECT id FROM users WHERE id = ?', [userId]);

    if (existing.length === 0) {
      // Create new user
      await conn.query(
        'INSERT INTO users (id, email, username, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
        [userId, email, username, displayName, avatarUrl]
      );
    } else {
      // Update existing user
      await conn.query(
        'UPDATE users SET email = ?, username = ?, display_name = ?, avatar_url = ? WHERE id = ?',
        [email, username, displayName, avatarUrl, userId]
      );
    }

    conn.release();
    res.json({ success: true, userId });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// ====== WORLDS ENDPOINTS ======

// Get all worlds for user
app.get('/api/worlds', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await pool.getConnection();
    const [worlds] = await conn.query(
      'SELECT id, title, description, version, created_at, updated_at FROM worlds WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
      [req.user.sub]
    );
    conn.release();

    res.json(worlds);
  } catch (err) {
    console.error('Error fetching worlds:', err);
    res.status(500).json({ error: 'Failed to fetch worlds' });
  }
});

// Get single world
app.get('/api/worlds/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      'SELECT * FROM worlds WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );
    conn.release();

    if (rows.length === 0) return res.status(404).json({ error: 'World not found' });

    const world = rows[0];
    world.state = typeof world.state === 'string' ? JSON.parse(world.state) : world.state;
    res.json(world);
  } catch (err) {
    console.error('Error fetching world:', err);
    res.status(500).json({ error: 'Failed to fetch world' });
  }
});

// Create/save world
app.post('/api/worlds', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, title, description, state } = req.body;
    const worldId = id || uuid();
    const userId = req.user.sub;

    const conn = await pool.getConnection();

    // Check if world exists
    const [existing] = await conn.query('SELECT id FROM worlds WHERE id = ? AND user_id = ?', [worldId, userId]);

    const stateJson = JSON.stringify(state);

    if (existing.length === 0) {
      // Create new world
      await conn.query(
        'INSERT INTO worlds (id, user_id, title, description, state, version) VALUES (?, ?, ?, ?, ?, ?)',
        [worldId, userId, title || 'Untitled World', description || '', stateJson, 1]
      );
    } else {
      // Update existing world
      await conn.query(
        'UPDATE worlds SET title = ?, description = ?, state = ?, version = version + 1, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [title || 'Untitled World', description || '', stateJson, worldId, userId]
      );
    }

    conn.release();
    res.json({ success: true, id: worldId });
  } catch (err) {
    console.error('Error saving world:', err);
    res.status(500).json({ error: 'Failed to save world' });
  }
});

// Delete world (soft delete)
app.delete('/api/worlds/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await pool.getConnection();
    await conn.query(
      'UPDATE worlds SET deleted_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );
    conn.release();

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting world:', err);
    res.status(500).json({ error: 'Failed to delete world' });
  }
});

// ====== BUILDS ENDPOINTS (History) ======

// Get build history for world
app.get('/api/worlds/:worldId/builds', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await pool.getConnection();
    const [builds] = await conn.query(
      'SELECT id, version, title, description, change_summary, created_at FROM builds WHERE world_id = ? AND user_id = ? ORDER BY version DESC LIMIT 50',
      [req.params.worldId, req.user.sub]
    );
    conn.release();

    res.json(builds);
  } catch (err) {
    console.error('Error fetching builds:', err);
    res.status(500).json({ error: 'Failed to fetch builds' });
  }
});

// Create build (save current version)
app.post('/api/worlds/:worldId/builds', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, state, changeSummary } = req.body;
    const buildId = uuid();
    const worldId = req.params.worldId;
    const userId = req.user.sub;

    const conn = await pool.getConnection();

    // Get current version
    const [worlds] = await conn.query('SELECT version FROM worlds WHERE id = ? AND user_id = ?', [worldId, userId]);
    if (worlds.length === 0) return res.status(404).json({ error: 'World not found' });

    const version = worlds[0].version;
    const stateJson = JSON.stringify(state);

    await conn.query(
      'INSERT INTO builds (id, world_id, user_id, title, description, state, change_summary, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [buildId, worldId, userId, title || '', description || '', stateJson, changeSummary || '', version]
    );

    conn.release();
    res.json({ success: true, buildId });
  } catch (err) {
    console.error('Error creating build:', err);
    res.status(500).json({ error: 'Failed to create build' });
  }
});

// Restore world to specific build
app.post('/api/worlds/:worldId/builds/:buildId/restore', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { worldId, buildId } = req.params;
    const userId = req.user.sub;

    const conn = await pool.getConnection();

    // Get build
    const [builds] = await conn.query(
      'SELECT state FROM builds WHERE id = ? AND world_id = ? AND user_id = ?',
      [buildId, worldId, userId]
    );

    if (builds.length === 0) return res.status(404).json({ error: 'Build not found' });

    const state = builds[0].state;

    // Update world
    await conn.query(
      'UPDATE worlds SET state = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [JSON.stringify(state), worldId, userId]
    );

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error restoring build:', err);
    res.status(500).json({ error: 'Failed to restore build' });
  }
});

// ====== PREFERENCES ENDPOINT ======

app.get('/api/preferences', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const conn = await pool.getConnection();
    const [prefs] = await conn.query('SELECT data FROM preferences WHERE user_id = ?', [req.user.sub]);
    conn.release();

    if (prefs.length === 0) return res.json({});

    const data = typeof prefs[0].data === 'string' ? JSON.parse(prefs[0].data) : prefs[0].data;
    res.json(data);
  } catch (err) {
    console.error('Error fetching preferences:', err);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.put('/api/preferences', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.user.sub;
    const data = req.body;

    const conn = await pool.getConnection();

    // Check if exists
    const [existing] = await conn.query('SELECT id FROM preferences WHERE user_id = ?', [userId]);

    const dataJson = JSON.stringify(data);

    if (existing.length === 0) {
      await conn.query(
        'INSERT INTO preferences (id, user_id, data) VALUES (?, ?, ?)',
        [uuid(), userId, dataJson]
      );
    } else {
      await conn.query(
        'UPDATE preferences SET data = ? WHERE user_id = ?',
        [dataJson, userId]
      );
    }

    conn.release();
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving preferences:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// ====== HEALTH CHECK ======

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
async function start() {
  try {
    await initDatabase();
    console.log('✓ Database connected');

    app.listen(PORT, () => {
      console.log(`✓ TinyWorld Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
