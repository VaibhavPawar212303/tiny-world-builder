// Backend: User logout endpoint - TiDB integration
const { query } = require('../lib/db');
const { initializeDatabase } = require('../lib/db-init');

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
