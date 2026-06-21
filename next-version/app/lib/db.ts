import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!pool) {
    const url = new URL(process.env.DATABASE_URL);

    pool = mysql.createPool({
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl') || '{}') : undefined,
    });
  }

  return pool;
}

export async function query(sql: string, values?: any[]) {
  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } finally {
    connection.release();
  }
}
