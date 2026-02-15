require('dotenv').config();

const common = {
  dialect: 'mysql',
  logging: false,
};

const base = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
};

module.exports = {
  development: Object.assign({}, common, base, {
    database: process.env.DB_NAME || 'namMoi_DB'
  }),

  test: Object.assign({}, common, base, {
    database: process.env.DB_NAME || 'namMoi_DB_test'
  }),

  production: Object.assign({}, common, base, {
    database: process.env.DB_NAME || 'namMoi_DB'
  })
};
