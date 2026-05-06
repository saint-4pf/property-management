const { Pool } = require('pg');
require('dotenv').config();

// Pool maintains multiple connections
// Much more efficient than creating a new connection per query
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection pool settings
  max: 10,                // maximum 10 simultaneous connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err.message);
  process.exit(1);
});

// We export query as a function so every
// part of the app uses the same pool
const query = (text, params) => pool.query(text, params);

// Transaction helper — wraps multiple queries
// in a single atomic database transaction
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, withTransaction, pool };