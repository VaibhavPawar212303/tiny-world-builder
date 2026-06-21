const { v4: uuid } = require('uuid');
const { query } = require('../../lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('../../lib/auth.js');

module.exports = async function handler(req, res) {
  console.log('[WORLDS-CATCH-ALL] Request received');
  console.log('[WORLDS-CATCH-ALL] Path:', req.url);
  console.log('[WORLDS-CATCH-ALL] Method:', req.method);
  console.log('[WORLDS-CATCH-ALL] Query:', req.query);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const path = req.query.path || [];
    const pathStr = Array.isArray(path) ? path.join('/') : path;

    console.log('[WORLDS-CATCH-ALL] Path array:', path);
    console.log('[WORLDS-CATCH-ALL] Path string:', pathStr);

    // Route based on path pattern
    // /api/worlds -> handled by index.js
    // /api/worlds/:id -> handled by [id].js
    // /api/worlds/:id/builds -> needs to be handled here
    // /api/worlds/:id/builds/:buildId/restore -> needs to be handled here

    if (pathStr.endsWith('/builds') && req.method === 'GET') {
      // GET /api/worlds/:id/builds
      const worldId = pathStr.split('/')[0];
      console.log('[WORLDS-CATCH-ALL] Handling: GET builds for world', worldId);

      const builds = await query(
        `SELECT id, world_id, user_id, title, description, change_summary, version, created_at
         FROM builds WHERE world_id = ? ORDER BY created_at DESC LIMIT 50`,
        [worldId]
      );

      console.log('[WORLDS-CATCH-ALL] Found', builds.length, 'builds');
      return sendSuccess(res, { builds });
    }

    if (pathStr.endsWith('/builds') && req.method === 'POST') {
      // POST /api/worlds/:id/builds
      const worldId = pathStr.split('/')[0];
      console.log('[WORLDS-CATCH-ALL] Handling: POST create build for world', worldId);

      const { title, description, state, changeSummary } = req.body;
      const buildId = uuid();

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

      console.log('[WORLDS-CATCH-ALL] Build created:', buildId);
      return sendSuccess(res, { id: buildId, success: true });
    }

    if (pathStr.includes('/builds/') && pathStr.endsWith('/restore') && req.method === 'POST') {
      // POST /api/worlds/:id/builds/:buildId/restore
      const parts = pathStr.split('/');
      const worldId = parts[0];
      const buildId = parts[2];
      console.log('[WORLDS-CATCH-ALL] Handling: POST restore build', buildId, 'for world', worldId);

      const buildResults = await query(
        `SELECT b.id, b.state FROM builds b
         JOIN worlds w ON b.world_id = w.id
         WHERE b.id = ? AND b.world_id = ? AND w.user_id = ?`,
        [buildId, worldId, userId]
      );

      if (buildResults.length === 0) {
        return sendError(res, 404, 'Build not found');
      }

      const build = buildResults[0];
      const state = typeof build.state === 'string' ? JSON.parse(build.state) : build.state;

      await query(
        `UPDATE worlds SET state = ?, version = version + 1, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [JSON.stringify(state), worldId, userId]
      );

      console.log('[WORLDS-CATCH-ALL] Build restored');
      return sendSuccess(res, { success: true });
    }

    console.warn('[WORLDS-CATCH-ALL] No route matched for:', pathStr, req.method);
    return sendError(res, 404, 'Endpoint not found');

  } catch (err) {
    console.error('[WORLDS-CATCH-ALL] Error:', err.message);
    console.error('[WORLDS-CATCH-ALL] Full error:', err);
    sendError(res, 500, 'Internal server error');
  }
};
