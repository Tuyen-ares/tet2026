require('dotenv').config();
const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
if (!process.env.DATABASE_URL && dbUrl) process.env.DATABASE_URL = dbUrl;

const common = {
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
};

const base = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || (process.env.DB_DIALECT === 'postgres' ? 5432 : 3306)),
  username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = {
  development: Object.assign({}, common, base, {
    database: process.env.DB_NAME || 'namMoi_DB'
  }),

  test: Object.assign({}, common, base, {
    database: process.env.DB_NAME || 'namMoi_DB_test'
  }),

  production: Object.assign({}, common, base, (dbUrl ? {
    url: dbUrl,
    use_env_variable: 'DATABASE_URL',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  } : {}), {
    database: process.env.DB_NAME || 'namMoi_DB'
  })
};
