import { Sequelize } from "sequelize";
import { env, dbConfig } from "./env.js";

const poolMax = Number(process.env.DB_POOL_MAX || 10);
const poolMin = Number(process.env.DB_POOL_MIN || 0);
const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
const dialect = process.env.DB_DIALECT || dbConfig.dialect || "mysql";
const sslCa = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, "\n") : undefined;
const sslEnabled =
  process.env.DB_SSL === "true" ||
  process.env.DB_SSL_MODE === "require" ||
  Boolean(sslCa) ||
  (dbUrl && dbUrl.includes("sslmode=require"));
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

const sequelizeOptions = {
  dialect,
  host: process.env.DB_HOST || dbConfig.host,
  port: Number(process.env.DB_PORT || dbConfig.port || (dialect === "postgres" ? 5432 : 3306)),
  username: process.env.DB_USER || dbConfig.username,
  password: process.env.DB_PASS || dbConfig.password,
  database: process.env.DB_NAME || dbConfig.database,
  logging: env.dbLogging ? console.log : false,
  pool: {
    max: poolMax,
    min: poolMin,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: sslEnabled
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: sslRejectUnauthorized,
          ...(sslCa ? { ca: sslCa } : {}),
        },
      }
    : {},
};

let sequelize;
if (dbUrl) {
  sequelize = new Sequelize(dbUrl, sequelizeOptions);
} else {
  sequelize = new Sequelize(sequelizeOptions);
}

export { sequelize };
