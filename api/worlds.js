// Worlds API - Create, read, update, delete user worlds
import crypto from 'crypto';
import mysql from 'mysql2/promise';

let pool = null;

async function getPool() {
  if (pool) {
    return pool;
  }

  try {
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

    // Drop worlds table to start fresh (avoid schema conflicts)
    try {
      await pool.execute('SET FOREIGN_KEY_CHECKS=0');
      await pool.execute('DROP TABLE IF EXISTS worlds');
      await pool.execute('SET FOREIGN_KEY_CHECKS=1');
      console.log('[DB-INIT] Dropped existing worlds table');
    } catch (e) {
      console.log('[DB-INIT] Table drop info:', e.message);
    }

    // Create worlds table
    const createWorldsTable = `
      CREATE TABLE worlds (
        id VARCHAR(40) PRIMARY KEY,
        user_id VARCHAR(40) NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'Untitled World',
        description TEXT,
        state LONGTEXT NOT NULL,
        version INT DEFAULT 1,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await pool.execute(createWorldsTable);
    console.log('[DB-INIT] Worlds table created');
    return true;

  } catch (error) {
    console.error('[DB-INIT] Error:', error.message);
    throw error;
  }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

function getUserIdFromToken(token) {
  // Extract user ID from token
  // Format: "auth_<random>" from login, "guest-token-<id>" for guest
  if (token.startsWith('auth_')) {
    // For demo, store user ID in a simple map
    // In production, verify JWT and extract user_id from payload
    return token.replace('auth_', 'user_');
  }
  if (token.startsWith('guest-token-')) {
    return token.replace('guest-token-', 'guest_');
  }
  return null;
}

async function handleGetWorlds(req, res, userId) {
  try {
    const worlds = await query(
      'SELECT id, title, description, version, is_public, created_at, updated_at FROM worlds WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100',
      [userId]
    );

    console.log('[WORLDS] Found', worlds.length, 'worlds for user:', userId);

    return res.status(200).json({
      worlds: worlds || []
    });

  } catch (error) {
    console.error('[API] Get worlds error:', error);
    return res.status(500).json({ error: 'Failed to fetch worlds' });
  }
}

async function handleCreateWorld(req, res, userId) {
  try {
    const { title, description, state } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'World state is required' });
    }

    const worldId = 'world_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const stateJson = typeof state === 'string' ? state : JSON.stringify(state);

    await query(
      `INSERT INTO worlds (id, user_id, title, description, state, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [worldId, userId, title || 'Untitled World', description || '', stateJson, now, now]
    );

    console.log('[WORLDS] World created:', worldId, 'for user:', userId);

    return res.status(201).json({
      id: worldId,
      title: title || 'Untitled World',
      success: true
    });

  } catch (error) {
    console.error('[API] Create world error:', error);
    return res.status(500).json({ error: 'Failed to create world' });
  }
}

async function handleGetWorld(req, res, userId, worldId) {
  try {
    const worlds = await query(
      'SELECT id, user_id, title, description, state, version, is_public, created_at, updated_at FROM worlds WHERE id = ? AND user_id = ?',
      [worldId, userId]
    );

    if (worlds.length === 0) {
      return res.status(404).json({ error: 'World not found' });
    }

    const world = worlds[0];
    world.state = typeof world.state === 'string' ? JSON.parse(world.state) : world.state;

    console.log('[WORLDS] World fetched:', worldId);

    return res.status(200).json(world);

  } catch (error) {
    console.error('[API] Get world error:', error);
    return res.status(500).json({ error: 'Failed to fetch world' });
  }
}

async function handleUpdateWorld(req, res, userId, worldId) {
  try {
    const { title, description, state } = req.body;

    // Verify ownership
    const worlds = await query(
      'SELECT id FROM worlds WHERE id = ? AND user_id = ?',
      [worldId, userId]
    );

    if (worlds.length === 0) {
      return res.status(404).json({ error: 'World not found' });
    }

    const stateJson = typeof state === 'string' ? state : JSON.stringify(state);
    const now = new Date().toISOString();

    await query(
      `UPDATE worlds SET title = ?, description = ?, state = ?, version = version + 1, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [title || 'Untitled World', description || '', stateJson, now, worldId, userId]
    );

    console.log('[WORLDS] World updated:', worldId);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[API] Update world error:', error);
    return res.status(500).json({ error: 'Failed to update world' });
  }
}

async function handleDeleteWorld(req, res, userId, worldId) {
  try {
    // Verify ownership
    const worlds = await query(
      'SELECT id FROM worlds WHERE id = ? AND user_id = ?',
      [worldId, userId]
    );

    if (worlds.length === 0) {
      return res.status(404).json({ error: 'World not found' });
    }

    await query('DELETE FROM worlds WHERE id = ? AND user_id = ?', [worldId, userId]);

    console.log('[WORLDS] World deleted:', worldId);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[API] Delete world error:', error);
    return res.status(500).json({ error: 'Failed to delete world' });
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize database
    await initializeDatabase();

    // Get auth token
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Extract user ID from token
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[WORLDS] Request from user:', userId, 'Method:', req.method);

    // Route based on method and path
    const pathParts = (req.query.worldId || '').toString().split('/').filter(Boolean);
    const worldId = pathParts[0];

    // GET /api/worlds - List all worlds for user
    if (req.method === 'GET' && !worldId) {
      return handleGetWorlds(req, res, userId);
    }

    // GET /api/worlds/:id - Get specific world
    if (req.method === 'GET' && worldId) {
      return handleGetWorld(req, res, userId, worldId);
    }

    // POST /api/worlds - Create new world
    if (req.method === 'POST' && !worldId) {
      return handleCreateWorld(req, res, userId);
    }

    // PUT /api/worlds/:id - Update world
    if (req.method === 'PUT' && worldId) {
      return handleUpdateWorld(req, res, userId, worldId);
    }

    // DELETE /api/worlds/:id - Delete world
    if (req.method === 'DELETE' && worldId) {
      return handleDeleteWorld(req, res, userId, worldId);
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('[API] Worlds handler error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}
