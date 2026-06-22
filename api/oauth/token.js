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

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('[OAuth] CLERK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server not configured' });
    }

    // Exchange authorization code with Clerk for a token
    const oauthClientId = 'lIdrbFqcu0TXAMji';
    const oauthClientSecret = 'mKqDTZAVGeb659rHCRmI7y46KYG4laZk';
    const clerkInstance = 'charmed-redbird-23.clerk.accounts.dev';

    const tokenEndpoint = `https://${clerkInstance}/oauth/token`;

    console.log('[OAuth] Exchanging code with Clerk token endpoint:', tokenEndpoint);

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: oauthClientId,
        client_secret: oauthClientSecret,
        code: code,
        redirect_uri: 'https://tiny-world-builder-seven.vercel.app/oauth-callback.html'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[OAuth] Clerk token exchange failed:', tokenResponse.status, error);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange code with Clerk',
        details: error
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('[OAuth] ✓ Token received from Clerk');

    const clerkToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // Decode the ID token to get user info
    let userInfo = null;
    if (idToken) {
      try {
        const parts = idToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userInfo = payload;
        console.log('[OAuth] User from ID token:', payload.email);
      } catch (err) {
        console.warn('[OAuth] Could not decode ID token:', err.message);
      }
    }

    // Create app's own JWT token for backend authentication
    const secret = new TextEncoder().encode(process.env.CLERK_SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);

    const userId = userInfo?.sub || ('user_' + Date.now());
    const userEmail = userInfo?.email || provider + '@clerk.local';

    const appToken = await new jose.SignJWT({
      sub: userId,
      email: userEmail,
      provider: provider,
      iat: now,
      exp: now + 3600 * 24,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    console.log('[OAuth] ✓ App token created for user:', userId);

    const user = {
      id: userId,
      email: userEmail,
      name: userInfo?.name || userInfo?.given_name,
      picture: userInfo?.picture,
      provider: provider,
      created_at: new Date().toISOString()
    };

    res.status(200).json({
      token: appToken,
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
