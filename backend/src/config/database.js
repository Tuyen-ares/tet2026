import { Sequelize } from "sequelize";
import { env, dbConfig } from "./env.js";

const sequelizeConfig = {
  dialect: "mysql",
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  logging: env.dbLogging ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export const sequelize = new Sequelize(sequelizeConfig);
