"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("links", {
      id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      wish: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      min: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1000,
      },
      max: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10000,
      },
      audio: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      sender: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      receiver: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "basic",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("links");
  },
};
