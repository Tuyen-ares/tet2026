require('dotenv').config();
const mysql = require('mysql2/promise');

(async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || '';
  const db = process.env.DB_NAME || 'namMoi_DB';

  try {
    const conn = await mysql.createConnection({ host, port, user, password, database: db });
    // Check information_schema for column presence
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'links' AND COLUMN_NAME = 'title'`,
      [db]
    );
    if (!rows || rows.length === 0) {
      await conn.query("ALTER TABLE `links` ADD COLUMN `title` varchar(255) DEFAULT NULL;");
      console.log('Added `title` column to links table.');
    } else {
      console.log('`title` column already exists.');
    }
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure column:', err.message || err);
    process.exit(1);
  }
})();
