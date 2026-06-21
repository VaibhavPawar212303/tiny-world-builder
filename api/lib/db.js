const mysql = require('mysql2/promise');

let pool = null;

async function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

async function query(sql, values) {
  const pool = await getPool();
  const [result] = await pool.execute(sql, values);
  return result;
}

module.exports = { getPool, query };
