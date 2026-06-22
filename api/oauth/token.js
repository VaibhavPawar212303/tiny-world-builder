// OAuth Token Exchange Endpoint
// Exchanges Clerk OAuth authorization code for JWT token

const jose = require('jose');

module.exports = async (req, res) => {
  console.log('[OAuth] Token exchange request');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, provider } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    console.log('[OAuth] Provider:', provider);
    console.log('[OAuth] Code length:', code.length);

    // In a real implementation, exchange the code with Clerk's backend
    // For now, create a test token using the code
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('[OAuth] CLERK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server not configured' });
    }

    // Create a JWT token
    const secret = new TextEncoder().encode(process.env.CLERK_SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);

    // Extract user info from code (in production, fetch from Clerk API)
    // For demo, create a test user with provider info
    const userId = 'user_' + Date.now();
    const userEmail = `${provider}-user-${Date.now()}@clerk.local`;

    const token = await new jose.SignJWT({
      sub: userId,
      email: userEmail,
      provider: provider,
      iat: now,
      exp: now + 3600 * 24, // 24 hours
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    console.log('[OAuth] ✓ Token created for user:', userId);

    const user = {
      id: userId,
      email: userEmail,
      provider: provider,
      created_at: new Date().toISOString()
    };

    // Store user in database (optional)
    // await db.user.upsert({ id: userId, email: userEmail, provider });

    res.status(200).json({
      token,
      user,
      message: 'OAuth token exchange successful'
    });

  } catch (err) {
    console.error('[OAuth] Token exchange failed:', err.message);
    res.status(500).json({
      error: 'Token exchange failed',
      message: err.message
    });
  }
};
