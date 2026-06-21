import { v4 as uuid } from 'uuid';
import { query } from '../lib/db.js';
import { extractUserFromRequest, sendError, sendSuccess } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = await extractUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const userId = user.sub;

    if (req.method === 'GET') {
      // List user's worlds
      const worlds = await query(
        'SELECT id, title, description, version, is_public, created_at, updated_at FROM worlds WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
      return sendSuccess(res, { worlds });
    }

    if (req.method === 'POST') {
      // Create new world
      const { title, description, state } = req.body;
      const worldId = uuid();

      await query(
        `INSERT INTO worlds (id, user_id, title, description, state, version, is_public)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [worldId, userId, title || 'Untitled World', description || '', JSON.stringify(state || {})]
      );

      return sendSuccess(res, { id: worldId, success: true });
    }
  } catch (err) {
    console.error('Worlds error:', err);
    sendError(res, 500, 'Internal server error');
  }
}
