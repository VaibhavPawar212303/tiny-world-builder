const { getPool } = require('./lib/db.js');

module.exports = async function handler(req, res) {
  console.log('[HEALTH] Request received');
  console.log('[HEALTH] Method:', req.method);
  console.log('[HEALTH] Headers:', Object.keys(req.headers));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('[HEALTH] Handling OPTIONS request');
    return res.status(200).end();
  }

  try {
    console.log('[HEALTH] Getting database pool...');
    const pool = await getPool();
    console.log('[HEALTH] Pool obtained, executing test query...');
    const [result] = await pool.execute('SELECT 1');
    console.log('[HEALTH] Test query successful');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('[HEALTH] Health check failed:', err.message);
    console.error('[HEALTH] Error type:', err.constructor.name);
    console.error('[HEALTH] Full error:', err);
    res.status(500).json({
      status: 'error',
      error: 'Database unavailable',
      message: err.message,
      code: err.code
    });
  }
};
