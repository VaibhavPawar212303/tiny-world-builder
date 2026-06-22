// Backend: User login endpoint
import crypto from 'crypto';

// Shared user store (in a real app, this would be a database)
// For now, using a simple approach - in production use a real database
const userDatabase = {};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

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
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // For demo purposes, accept any valid email/password combination
    // In production, query a real database and verify the password hash
    const passwordHash = hashPassword(password);

    // Demo: Check if user exists in memory (this is simplified)
    // In production, use a real database
    let user = userDatabase[email];

    if (!user) {
      // Create demo user on first login (for testing)
      user = {
        id: 'user_' + crypto.randomBytes(8).toString('hex'),
        name: email.split('@')[0],
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      userDatabase[email] = user;
    } else if (user.password_hash !== passwordHash) {
      // Check password
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = 'auth_' + generateToken();

    // Return user data
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('[API] Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
