import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: 5434,
});

// Set the date style to ISO format
pool.on('connect', async (client) => {
  await client.query('SET datestyle TO ISO');
});

export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}; 