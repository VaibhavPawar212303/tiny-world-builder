const { v4: uuid } = require('uuid');
const { query } = require('../../lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('../../lib/auth.js');

module.exports = async function handler(req, res) {
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
    const { id: worldId } = req.query;

    // Verify world belongs to user
    const worldResults = await query(
      'SELECT id FROM worlds WHERE id = ? AND user_id = ?',
      [worldId, userId]
    );

    if (worldResults.length === 0) {
      return sendError(res, 404, 'World not found');
    }

    if (req.method === 'GET') {
      // List builds for world
      const builds = await query(
        `SELECT id, world_id, user_id, title, description, change_summary, version, created_at
         FROM builds WHERE world_id = ? ORDER BY created_at DESC LIMIT 50`,
        [worldId]
      );

      return sendSuccess(res, { builds });
    }

    if (req.method === 'POST') {
      // Create new build
      const { title, description, state, changeSummary } = req.body;
      const buildId = uuid();

      // Get current version
      const versionResults = await query(
        'SELECT version FROM worlds WHERE id = ?',
        [worldId]
      );

      const version = versionResults[0]?.version || 1;

      await query(
        `INSERT INTO builds (id, world_id, user_id, title, description, state, change_summary, version, parent_build_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [buildId, worldId, userId, title || '', description || '', JSON.stringify(state || {}), changeSummary || '', version]
      );

      return sendSuccess(res, { id: buildId, success: true });
    }
  } catch (err) {
    console.error('Builds error:', err);
    sendError(res, 500, 'Internal server error');
  }
}
