const jose = require('jose');

async function verifyToken(token) {
  try {
    console.log('[AUTH] Verifying token...');
    console.log('[AUTH] Token length:', token.length);
    console.log('[AUTH] Token starts with:', token.substring(0, 20));
    console.log('[AUTH] CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('[AUTH] CLERK_SECRET_KEY not set in environment!');
      return null;
    }

    // For debugging: allow test tokens that start with "test-token-"
    if (token.startsWith('test-token-')) {
      console.warn('[AUTH] Using test token (development only!)');
      const userId = token.replace('test-token-', '');
      return {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        test: true
      };
    }

    console.log('[AUTH] Verifying JWT with Clerk secret...');
    const secret = new TextEncoder().encode(process.env.CLERK_SECRET_KEY);
    const verified = await jose.jwtVerify(token, secret);
    console.log('[AUTH] Token verified successfully');
    console.log('[AUTH] User ID:', verified.payload.sub);
    return verified.payload;
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    console.error('[AUTH] Error code:', err.code);
    console.error('[AUTH] Full error:', err);
    return null;
  }
}

async function extractUserFromRequest(req) {
  console.log('[AUTH] Extracting user from request...');
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('[AUTH] No Authorization header found');
    return null;
  }

  console.log('[AUTH] Authorization header found, length:', authHeader.length);

  if (!authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Authorization header does not start with "Bearer "');
    console.warn('[AUTH] Header starts with:', authHeader.substring(0, 20));
    return null;
  }

  const token = authHeader.slice(7);
  console.log('[AUTH] Extracted token, length:', token.length);

  const user = await verifyToken(token);

  // Validate user has ID
  if (user && !user.sub) {
    console.error('[AUTH] Token verified but missing user ID (sub)');
    console.error('[AUTH] Payload:', JSON.stringify(user));
    return null;
  }

  if (user) {
    console.log('[AUTH] User ID:', user.sub);
  }

  return user;
}

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

function sendSuccess(res, data) {
  res.status(200).json(data);
}

module.exports = { verifyToken, extractUserFromRequest, sendError, sendSuccess };
