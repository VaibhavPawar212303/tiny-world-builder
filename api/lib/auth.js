import * as jose from 'jose';

export async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.CLERK_SECRET_KEY);
    const verified = await jose.jwtVerify(token, secret);
    return verified.payload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

export async function extractUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return await verifyToken(token);
}

export function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

export function sendSuccess(res, data) {
  res.status(200).json(data);
}
