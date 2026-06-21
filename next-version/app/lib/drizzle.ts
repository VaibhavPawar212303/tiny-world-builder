import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;

export async function getDatabase() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

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
      ssl: url.searchParams.get('ssl')
        ? JSON.parse(url.searchParams.get('ssl') || '{}')
        : undefined,
    });

    db = drizzle(pool, { schema });
  }

  return db;
}

export { schema };
