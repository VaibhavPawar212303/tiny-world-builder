const { query } = require('./lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('./lib/auth.js');

module.exports = async function handler(req, res) {
  console.log('[PROFILE] Request received');
  console.log('[PROFILE] Method:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[PROFILE] Handling OPTIONS request');
    return res.status(200).end();
  }

  try {
    const user = await extractUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const userId = user.sub;
    console.log('[PROFILE] User ID:', userId);

    if (req.method === 'GET') {
      // Get user profile
      console.log('[PROFILE] Fetching user profile');
      const results = await query(
        'SELECT id, email, username, display_name, avatar_url, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      if (results.length === 0) {
        console.log('[PROFILE] User not found in database');
        // Return minimal profile from token
        return sendSuccess(res, {
          id: userId,
          email: user.email || '',
          username: '',
          display_name: '',
          avatar_url: '',
          created_at: new Date().toISOString(),
        });
      }

      const profile = results[0];
      console.log('[PROFILE] Profile found');
      return sendSuccess(res, profile);
    }

    if (req.method === 'PUT') {
      // Update user profile
      console.log('[PROFILE] Updating user profile');
      const { email, username, displayName, avatarUrl } = req.body;

      // Check if user exists
      const results = await query(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (results.length === 0) {
        // Create user if doesn't exist
        console.log('[PROFILE] Creating new user');
        await query(
          `INSERT INTO users (id, email, username, display_name, avatar_url)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, email || '', username || '', displayName || '', avatarUrl || '']
        );
      } else {
        // Update existing user
        console.log('[PROFILE] Updating existing user');
        await query(
          `UPDATE users SET email = ?, username = ?, display_name = ?, avatar_url = ?, updated_at = NOW()
           WHERE id = ?`,
          [email || '', username || '', displayName || '', avatarUrl || '', userId]
        );
      }

      console.log('[PROFILE] Profile updated');
      return sendSuccess(res, { success: true });
    }
  } catch (err) {
    console.error('[PROFILE] Error:', err.message);
    console.error('[PROFILE] Full error:', err);
    sendError(res, 500, 'Internal server error');
  }
};
