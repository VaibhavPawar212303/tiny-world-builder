// Backend: User signup endpoint
import crypto from 'crypto';

const users = new Map(); // In-memory store (replace with database in production)

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists (in-memory check)
    if (users.has(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = {
      id: 'user_' + crypto.randomBytes(8).toString('hex'),
      name,
      email,
      password_hash: hashPassword(password),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store user (in-memory)
    users.set(email, user);

    // Generate token
    const token = generateToken();

    // Return user data (without password)
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('[API] Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
