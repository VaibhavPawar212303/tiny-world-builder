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

    // Check if table exists before creating
    const checkTable = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'worlds'`;
    const [existingTables] = await pool.execute(checkTable);

    if (existingTables.length > 0) {
      console.log('[DB-INIT] Worlds table already exists');
      return true;
    }

    // Create worlds table if it doesn't exist
    const createWorldsTable = `
      CREATE TABLE worlds (
        id VARCHAR(40) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
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

async function getUserIdFromToken(token) {
  // Look up the real user_id from the sessions table using the token
  try {
    const sessions = await query(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      console.log('[API] Token not found in sessions or expired');
      return null;
    }

    return sessions[0].user_id;
  } catch (error) {
    console.error('[API] Error looking up token:', error.message);
    return null;
  }
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

    console.log('[🔵 API] ========== CREATE WORLD ==========');
    console.log('[🔵 API] User ID:', userId);
    console.log('[🔵 API] Title:', title);
    console.log('[🔵 API] Description:', description);
    console.log('[🔵 API] State size:', JSON.stringify(state).length, 'bytes');

    if (!state) {
      console.error('[🔵 API] ❌ State is required');
      return res.status(400).json({ error: 'World state is required' });
    }

    const worldId = 'world_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const stateJson = typeof state === 'string' ? state : JSON.stringify(state);

    console.log('[🔵 API] Generated worldId:', worldId);
    console.log('[🔵 API] State JSON size:', stateJson.length, 'bytes');
    console.log('[🔵 API] Inserting into TiDB...');

    await query(
      `INSERT INTO worlds (id, user_id, title, description, state, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [worldId, userId, title || 'Untitled World', description || '', stateJson, now, now]
    );

    console.log('[🔵 API] ✓ Inserted to TiDB');
    console.log('[🔵 API] ├─ id:', worldId);
    console.log('[🔵 API] ├─ user_id:', userId);
    console.log('[🔵 API] ├─ title:', title || 'Untitled World');
    console.log('[🔵 API] ├─ state_size:', stateJson.length);
    console.log('[🔵 API] ├─ created_at:', now);
    console.log('[🔵 API] └─ version: 1');

    const response = {
      id: worldId,
      title: title || 'Untitled World',
      success: true
    };

    console.log('[🔵 API] Response:', response);
    console.log('[🔵 API] ========== CREATE WORLD DONE ==========');

    return res.status(201).json(response);

  } catch (error) {
    console.error('[🔵 API] ❌ Create world error:', error.message);
    return res.status(500).json({ error: 'Failed to create world: ' + error.message });
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

    console.log('[🟢 API] ========== UPDATE WORLD ==========');
    console.log('[🟢 API] World ID:', worldId);
    console.log('[🟢 API] User ID:', userId);
    console.log('[🟢 API] Title:', title);
    console.log('[🟢 API] Description:', description);
    console.log('[🟢 API] State size:', JSON.stringify(state).length, 'bytes');

    // Verify ownership
    console.log('[🟢 API] Checking ownership...');
    console.log('[🟢 API] ├─ Looking for id:', worldId);
    console.log('[🟢 API] └─ With user_id:', userId);

    const worlds = await query(
      'SELECT id, version FROM worlds WHERE id = ? AND user_id = ?',
      [worldId, userId]
    );

    console.log('[🟢 API] Query result:', worlds.length, 'rows found');
    if (worlds.length > 0) {
      console.log('[🟢 API] ├─ id:', worlds[0].id);
      console.log('[🟢 API] └─ version:', worlds[0].version);
    }

    if (worlds.length === 0) {
      console.error('[🟢 API] ❌ World not found:', worldId);
      console.error('[🟢 API] Listing all worlds for debugging:');
      const allWorlds = await query('SELECT id, user_id FROM worlds LIMIT 10', []);
      console.log('[🟢 API] All worlds:', allWorlds);
      return res.status(404).json({ error: 'World not found' });
    }

    console.log('[🟢 API] ✓ World found, current version:', worlds[0].version);

    const stateJson = typeof state === 'string' ? state : JSON.stringify(state);
    const now = new Date().toISOString();

    console.log('[🟢 API] State JSON size:', stateJson.length, 'bytes');
    console.log('[🟢 API] Updating TiDB...');

    const result = await query(
      `UPDATE worlds SET title = ?, description = ?, state = ?, version = version + 1, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [title || 'Untitled World', description || '', stateJson, now, worldId, userId]
    );

    console.log('[🟢 API] ✓ Updated TiDB');
    console.log('[🟢 API] ├─ id:', worldId);
    console.log('[🟢 API] ├─ user_id:', userId);
    console.log('[🟢 API] ├─ title:', title || 'Untitled World');
    console.log('[🟢 API] ├─ state_size:', stateJson.length);
    console.log('[🟢 API] ├─ new_version:', worlds[0].version + 1);
    console.log('[🟢 API] ├─ updated_at:', now);
    console.log('[🟢 API] └─ affected_rows:', result.affectedRows);

    console.log('[🟢 API] Response: { success: true }');
    console.log('[🟢 API] ========== UPDATE WORLD DONE ==========');

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[🟢 API] ❌ Update world error:', error.message);
    return res.status(500).json({ error: 'Failed to update world: ' + error.message });
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
  console.log('\n════════════════════════════════════════');
  console.log('[📡 HANDLER] Incoming request');
  console.log('[📡 HANDLER] ├─ Method:', req.method);
  console.log('[📡 HANDLER] ├─ URL:', req.url);
  console.log('[📡 HANDLER] ├─ Query:', req.query);
  console.log('[📡 HANDLER] └─ Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? `${req.headers.authorization.substring(0, 30)}...` : 'MISSING'
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[📡 HANDLER] ✓ OPTIONS request');
    return res.status(200).end();
  }

  try {
    // Initialize database
    console.log('[📡 HANDLER] Initializing database...');
    await initializeDatabase();
    console.log('[📡 HANDLER] ✓ Database initialized');

    // Get auth token
    const token = getTokenFromRequest(req);
    console.log('[📡 HANDLER] Token:', token ? `${token.substring(0, 30)}...` : '❌ MISSING');

    if (!token) {
      console.error('[📡 HANDLER] ❌ No authorization token');
      return res.status(401).json({ error: 'Authorization required' });
    }

    // Look up user ID from token in sessions table
    const userId = await getUserIdFromToken(token);
    console.log('[📡 HANDLER] User ID from token:', userId);

    if (!userId) {
      console.error('[📡 HANDLER] ❌ Could not extract user ID from token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[📡 HANDLER] ✓ Authenticated - User:', userId);

    // Route based on method and path
    const queryWorldId = req.query.worldId ? req.query.worldId.toString() : '';
    const pathParts = queryWorldId.split('/').filter(Boolean);
    const worldId = pathParts[0] || '';
    console.log('[📡 HANDLER] req.query:', req.query);
    console.log('[📡 HANDLER] queryWorldId:', queryWorldId);
    console.log('[📡 HANDLER] worldId param:', worldId || 'NONE');

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
