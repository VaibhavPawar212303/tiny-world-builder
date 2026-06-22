// Backend: User logout endpoint
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In a real application, invalidate the token in a blacklist or database
    // For now, just acknowledge the logout
    console.log('[API] User logged out');

    return res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('[API] Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
