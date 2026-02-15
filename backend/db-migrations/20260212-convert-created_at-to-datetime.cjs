"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('links', 'created_at_dt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    const [rows] = await queryInterface.sequelize.query('SELECT id, created_at FROM links');
    for (const r of rows) {
      const id = r.id;
      const ms = Number(r.created_at);
      const dt = isNaN(ms) ? null : new Date(ms);
      await queryInterface.bulkUpdate('links', { created_at_dt: dt }, { id });
    }

    await queryInterface.removeColumn('links', 'created_at');
    await queryInterface.renameColumn('links', 'created_at_dt', 'created_at');

    await queryInterface.changeColumn('links', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  async down(queryInterface, Sequelize) {
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
