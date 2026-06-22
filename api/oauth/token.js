// OAuth Token Exchange Endpoint
// Exchanges Clerk OAuth authorization code for JWT token

const jose = require('jose');

module.exports = async (req, res) => {
  console.log('[OAuth Token] ========== Token Exchange Started ==========');
  console.log('[OAuth Token] Request method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, provider } = req.body;

    console.log('[OAuth Token] Request body:', { code: code?.substring(0, 20) + '...', provider });

    if (!code) {
      console.error('[OAuth Token] No authorization code provided');
      return res.status(400).json({ error: 'Authorization code required' });
    }

    console.log('[OAuth Token] Provider:', provider);
    console.log('[OAuth Token] Code length:', code.length);

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('[OAuth Token] CLERK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server not configured' });
    }
    console.log('[OAuth Token] ✓ CLERK_SECRET_KEY available');

    // Exchange authorization code with Clerk for a token
    const oauthClientId = 'lIdrbFqcu0TXAMji';
    const oauthClientSecret = 'mKqDTZAVGeb659rHCRmI7y46KYG4laZk';
    const clerkInstance = 'charmed-redbird-23.clerk.accounts.dev';

    const tokenEndpoint = `https://${clerkInstance}/oauth/token`;
    const redirectUri = 'https://tiny-world-builder-seven.vercel.app/oauth-callback.html';

    console.log('[OAuth Token] Client ID:', oauthClientId);
    console.log('[OAuth Token] Client Secret length:', oauthClientSecret.length);
    console.log('[OAuth Token] Token endpoint:', tokenEndpoint);
    console.log('[OAuth Token] Redirect URI:', redirectUri);
    console.log('[OAuth Token] Exchanging code with Clerk...');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: oauthClientId,
      client_secret: oauthClientSecret,
      code: code,
      redirect_uri: redirectUri
    }).toString();

    console.log('[OAuth Token] POST body length:', body.length);
    console.log('[OAuth Token] Making POST request to Clerk...');

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body
    });

    console.log('[OAuth Token] Response status:', tokenResponse.status);
    console.log('[OAuth Token] Response headers:', JSON.stringify(Object.fromEntries(tokenResponse.headers.entries())));

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[OAuth Token] Clerk token exchange FAILED');
      console.error('[OAuth Token] Status:', tokenResponse.status);
      console.error('[OAuth Token] Error response:', error);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange code with Clerk',
        details: error,
        status: tokenResponse.status
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('[OAuth Token] ✓ Token received from Clerk');
    console.log('[OAuth Token] Token data keys:', Object.keys(tokenData));

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
