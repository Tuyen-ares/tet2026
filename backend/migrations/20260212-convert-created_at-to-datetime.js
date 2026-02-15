"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) add temporary datetime column
    await queryInterface.addColumn('links', 'created_at_dt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 2) read existing rows and convert millisecond epoch to Date objects
    const [rows] = await queryInterface.sequelize.query('SELECT id, created_at FROM links');
    for (const r of rows) {
      const id = r.id;
      const ms = Number(r.created_at);
      const dt = isNaN(ms) ? null : new Date(ms);
      await queryInterface.bulkUpdate('links', { created_at_dt: dt }, { id });
    }

    // 3) drop old column and rename the temp column
    await queryInterface.removeColumn('links', 'created_at');
    await queryInterface.renameColumn('links', 'created_at_dt', 'created_at');

    // 4) ensure not null and default
    await queryInterface.changeColumn('links', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert: add bigint column and populate with ms since epoch
    await queryInterface.addColumn('links', 'created_at_old', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });

    const [rows] = await queryInterface.sequelize.query('SELECT id, created_at FROM links');
    for (const r of rows) {
      const id = r.id;
      const dt = r.created_at ? new Date(r.created_at) : null;
      const ms = dt ? dt.getTime() : null;
      await queryInterface.bulkUpdate('links', { created_at_old: ms }, { id });
    }

    await queryInterface.removeColumn('links', 'created_at');
    await queryInterface.renameColumn('links', 'created_at_old', 'created_at');

    await queryInterface.changeColumn('links', 'created_at', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  }
};
