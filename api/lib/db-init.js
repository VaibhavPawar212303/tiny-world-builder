// Database initialization - create tables if they don't exist
const { getPool } = require('./db');

async function initializeDatabase() {
  try {
    const pool = await getPool();
    console.log('[DB-INIT] Initializing database schema...');

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createUsersTable);
    console.log('[DB-INIT] ✓ Users table created or already exists');

    // Create sessions table
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createSessionsTable);
    console.log('[DB-INIT] ✓ Sessions table created or already exists');

    console.log('[DB-INIT] ✓ Database initialization complete');
    return true;

  } catch (error) {
    console.error('[DB-INIT] Error initializing database:', error.message);
    throw error;
  }
}

module.exports = { initializeDatabase };
