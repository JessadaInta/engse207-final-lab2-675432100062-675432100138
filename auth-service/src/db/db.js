const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Auto-create tables on startup
async function initDB() {
  const fs = require('fs');
  const path = require('path');

  const sql = fs.readFileSync(
    path.join(__dirname, '../../init.sql'),
    'utf8'
  );

  await pool.query(sql);

  console.log('[auth-db] Tables initialized');
}

module.exports = {
  pool,
  initDB
};