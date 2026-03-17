const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Auto-create tables
async function initDB() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'init.sql'),
      'utf8'
    );

    await pool.query(sql);
    console.log('[user-db] Tables initialized');

  } catch (err) {
    console.error('[user-db] init error:', err.message);
  }
}

module.exports = {
  pool,
  initDB
};