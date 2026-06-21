const { v4: uuid } = require('uuid');
const { query } = require('./lib/db.js');
const { extractUserFromRequest, sendError, sendSuccess } = require('./lib/auth.js');

module.exports = async function handler(req, res) {
  console.log('[ASSETS] Request received');
  console.log('[ASSETS] Method:', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[ASSETS] Handling OPTIONS request');
    return res.status(200).end();
  }

  try {
    const user = await extractUserFromRequest(req);
    if (!user) {
      return sendError(res, 401, 'Unauthorized');
    }

    const userId = user.sub;

    if (req.method === 'GET') {
      // List user's assets
      console.log('[ASSETS] Listing assets for user:', userId);
      const assets = await query(
        'SELECT id, asset_type, name, thumbnail_url, created_at FROM assets WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
        [userId]
      );
      console.log('[ASSETS] Found', assets.length, 'assets');
      return sendSuccess(res, { assets });
    }

    if (req.method === 'POST') {
      // Create new asset
      console.log('[ASSETS] Creating new asset');
      const { assetType, name, data, thumbnailUrl } = req.body;
      const assetId = uuid();

      await query(
        `INSERT INTO assets (id, user_id, asset_type, name, data, thumbnail_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [assetId, userId, assetType || '', name || '', JSON.stringify(data || {}), thumbnailUrl || '']
      );

      console.log('[ASSETS] Asset created:', assetId);
      return sendSuccess(res, { id: assetId, success: true });
    }

    if (req.method === 'PUT') {
      // Update asset
      console.log('[ASSETS] Updating asset');
      const { id, name, data, thumbnailUrl } = req.body;

      const results = await query(
        'SELECT id FROM assets WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (results.length === 0) {
        return sendError(res, 404, 'Asset not found');
      }

      await query(
        `UPDATE assets SET name = ?, data = ?, thumbnail_url = ? WHERE id = ? AND user_id = ?`,
        [name || '', JSON.stringify(data || {}), thumbnailUrl || '', id, userId]
      );

      console.log('[ASSETS] Asset updated:', id);
      return sendSuccess(res, { success: true });
    }

    if (req.method === 'DELETE') {
      // Delete asset
      console.log('[ASSETS] Deleting asset');
      const { id } = req.body;

      const results = await query(
        'SELECT id FROM assets WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (results.length === 0) {
        return sendError(res, 404, 'Asset not found');
      }

      await query('DELETE FROM assets WHERE id = ? AND user_id = ?', [id, userId]);

      console.log('[ASSETS] Asset deleted:', id);
      return sendSuccess(res, { success: true });
    }
  } catch (err) {
    console.error('[ASSETS] Error:', err.message);
    console.error('[ASSETS] Full error:', err);
    sendError(res, 500, 'Internal server error');
  }
};
