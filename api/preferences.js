import { query } from './lib/db.js';
import { extractUserFromRequest, sendError, sendSuccess } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      // Get user preferences
      const results = await query(
        'SELECT data FROM preferences WHERE user_id = ?',
        [userId]
      );

      const data = results.length > 0
        ? (typeof results[0].data === 'string' ? JSON.parse(results[0].data) : results[0].data)
        : {};

      return sendSuccess(res, { data });
    }

    if (req.method === 'PUT') {
      // Update preferences
      const { data } = req.body;

      const results = await query(
        'SELECT id FROM preferences WHERE user_id = ?',
        [userId]
      );

      if (results.length === 0) {
        await query(
          'INSERT INTO preferences (user_id, data) VALUES (?, ?)',
          [userId, JSON.stringify(data || {})]
        );
      } else {
        await query(
          'UPDATE preferences SET data = ?, updated_at = NOW() WHERE user_id = ?',
          [JSON.stringify(data || {}), userId]
        );
      }

      return sendSuccess(res, { success: true });
    }
  } catch (err) {
    console.error('Preferences error:', err);
    sendError(res, 500, 'Internal server error');
  }
}
