import { query } from '../lib/db.js';
import { extractUserFromRequest, sendError, sendSuccess } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
    const { id } = req.query;

    if (req.method === 'GET') {
      // Get specific world
      const results = await query(
        'SELECT * FROM worlds WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (results.length === 0) {
        return sendError(res, 404, 'World not found');
      }

      const world = results[0];
      world.state = typeof world.state === 'string' ? JSON.parse(world.state) : world.state;

      return sendSuccess(res, world);
    }

    if (req.method === 'PUT') {
      // Update world
      const { title, description, state } = req.body;

      const results = await query(
        'SELECT id FROM worlds WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (results.length === 0) {
        return sendError(res, 404, 'World not found');
      }

      await query(
        `UPDATE worlds SET title = ?, description = ?, state = ?, version = version + 1, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [title || '', description || '', JSON.stringify(state || {}), id, userId]
      );

      return sendSuccess(res, { success: true });
    }

    if (req.method === 'DELETE') {
      // Delete world
      const results = await query(
        'SELECT id FROM worlds WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (results.length === 0) {
        return sendError(res, 404, 'World not found');
      }

      await query('DELETE FROM worlds WHERE id = ? AND user_id = ?', [id, userId]);

      return sendSuccess(res, { success: true });
    }
  } catch (err) {
    console.error('World error:', err);
    sendError(res, 500, 'Internal server error');
  }
}
