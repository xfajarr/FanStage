import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "./schema.js"
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable');
}

const pool = new Pool({
  connectionString,
});

if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('Connected to the database');
  });

  pool.on('error', (err) => {
    console.error('Error connecting to the database', err);
  });
}

export const db = drizzle(pool, { schema });

export * from './schema.js';