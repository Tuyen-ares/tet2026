import dotenv from "dotenv";

dotenv.config();

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parseBool = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const v = String(value).toLowerCase().trim();
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return fallback;
};

const parseString = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s === '' ? fallback : s;
};

export const env = {
  port: parsePositiveInt(process.env.PORT, 3000),
  linkExpiryMs: parsePositiveInt(process.env.LINK_EXPIRY_MS, 20 * 60 * 1000),
  cleanupIntervalMs: parsePositiveInt(
    process.env.CLEANUP_INTERVAL_MS,
    5 * 60 * 1000
  ),
  dbLogging: process.env.DB_LOGGING === "true",
  // When true the server will call `sequelize.sync()` at startup.
  // Set DB_AUTO_SYNC=false in production if you prefer migrations only.
  dbAutoSync: process.env.DB_AUTO_SYNC === undefined ? true : process.env.DB_AUTO_SYNC === 'true',
  corsOrigins: process.env.CORS_ORIGINS || "*",
};

// Additional DB / dialect settings (MySQL/Postgres) read from env
export const dbConfig = {
  dialect: parseString(process.env.DB_DIALECT, 'mysql'),
  host: parseString(process.env.DB_HOST, '127.0.0.1'),
  port: parsePositiveInt(process.env.DB_PORT, 3306),
  username: parseString(process.env.DB_USER || process.env.DB_USERNAME, 'root'),
  password: parseString(process.env.DB_PASS || process.env.DB_PASSWORD, ''),
  database: parseString(process.env.DB_NAME, 'namMoi_DB'),
};
