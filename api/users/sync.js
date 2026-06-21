const { query } = require('../lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('../lib/auth.js');

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

    const { email, username, displayName, avatarUrl } = req.body;

    // Get user ID from token
    const clerkUserId = user.sub;

    // Validate user ID
    if (!clerkUserId) {
      console.error('[USERS] User ID is undefined in sync request');
      console.error('[USERS] User payload:', JSON.stringify(user));
      return sendError(res, 400, 'Invalid user ID');
    }

    // Validate email
    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    console.log('[USERS] Syncing user:', clerkUserId, 'email:', email);

    // Upsert user
    const sql = `
      INSERT INTO users (id, email, username, display_name, avatar_url)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        email = VALUES(email),
        username = VALUES(username),
        display_name = VALUES(display_name),
        avatar_url = VALUES(avatar_url),
        updated_at = NOW()
    `;

    await query(sql, [clerkUserId, email, username || '', displayName || '', avatarUrl || '']);

    sendSuccess(res, { success: true, userId: clerkUserId });
  } catch (err) {
    console.error('Sync failed:', err);
    sendError(res, 500, 'Internal server error');
  }
}
