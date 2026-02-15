import { sequelize } from '../src/config/database.js';
import { Link } from '../src/models/index.js';

const run = async () => {
  try {
    await sequelize.authenticate();
    const rows = await Link.findAll();
    console.log('links:', rows.map(r => r.toJSON()));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
