const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error:', err.message);
});

module.exports = pool;
