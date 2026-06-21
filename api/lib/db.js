const mysql = require('mysql2/promise');

let pool = null;

async function getPool() {
  if (pool) {
    console.log('[DB] Using existing pool connection');
    return pool;
  }

  try {
    console.log('[DB] Creating new connection pool...');

    // Use DATABASE_URL if available (full connection string with SSL)
    if (process.env.DATABASE_URL) {
      console.log('[DB] Using DATABASE_URL connection string');
      console.log('[DB] URL format: mysql://user:***@host:port/db?ssl=...');
      pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      console.log('[DB] Using individual environment variables');
      console.log('[DB] Host:', process.env.DB_HOST);
      console.log('[DB] Port:', process.env.DB_PORT || 4000);
      console.log('[DB] User:', process.env.DB_USER);
      console.log('[DB] Database:', process.env.DB_NAME);

      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: 'Amazon RDS',
        authPlugins: {
          mysql_native_password: () => () => process.env.DB_PASSWORD,
        },
      });
    }

    console.log('[DB] Pool created successfully');
    return pool;
  } catch (err) {
    console.error('[DB] Failed to create pool:', err.message);
    console.error('[DB] Full error:', err);
    throw err;
  }
}

async function query(sql, values) {
  try {
    console.log('[DB] Executing query:', sql.substring(0, 100) + '...');
    const pool = await getPool();
    const [result] = await pool.execute(sql, values);
    console.log('[DB] Query successful, rows:', result.length || 0);
    return result;
  } catch (err) {
    console.error('[DB] Query failed:', err.message);
    console.error('[DB] SQL:', sql);
    console.error('[DB] Full error:', err);
    throw err;
  }
}

module.exports = { getPool, query };
