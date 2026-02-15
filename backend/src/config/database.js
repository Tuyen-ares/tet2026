import { Sequelize } from "sequelize";
import { env, dbConfig } from "./env.js";

const poolMax = Number(process.env.DB_POOL_MAX || 10);
const poolMin = Number(process.env.DB_POOL_MIN || 0);

const sequelizeOptions = {
  dialect: process.env.DB_DIALECT || dbConfig.dialect || "mysql",
  host: process.env.DB_HOST || dbConfig.host,
  port: Number(process.env.DB_PORT || dbConfig.port || (process.env.DB_DIALECT === 'postgres' ? 5432 : 3306)),
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
  dialectOptions: {
    ...(process.env.DB_DIALECT === 'postgres' || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {})
  }
};

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
  sequelize = new Sequelize(sequelizeOptions);
}

export const sequelize = sequelize;
