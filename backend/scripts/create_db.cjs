require('dotenv').config();
const mysql = require('mysql2/promise');

(async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'namMoi_DB';

  console.log(`Connecting to MySQL ${host}:${port} as ${user} to create database '${dbName}'`);

  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${dbName}' created or already exists.`);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create database:', err.message || err);
    process.exit(1);
  }
})();
