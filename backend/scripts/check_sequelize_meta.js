import { sequelize } from '../src/config/database.js';

const run = async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query('SELECT * FROM SequelizeMeta');
    console.log('SequelizeMeta rows:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error querying SequelizeMeta:', err);
    process.exit(1);
  }
};

run();
