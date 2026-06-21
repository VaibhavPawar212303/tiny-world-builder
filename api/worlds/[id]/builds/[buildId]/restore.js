const { query } = require('../../../../lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('../../../../lib/auth.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const user = await extractUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const userId = user.sub;
    const { id: worldId, buildId } = req.query;

    // Verify world and build belong to user
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

    // Update world with restored state
    await query(
      `UPDATE worlds SET state = ?, version = version + 1, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [JSON.stringify(state), worldId, userId]
    );

    return sendSuccess(res, { success: true });
  } catch (err) {
    console.error('Restore error:', err);
    sendError(res, 500, 'Internal server error');
  }
}
