"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('links', [
      {
        id: 'sample1',
        name: 'Người Yêu',
        wish: 'Chúc mừng năm mới, {name}!',
        min: 1000,
        max: 10000,
        audio: '',
        sender: 'Anh',
        receiver: 'Em',
        type: 'basic',
        created_at: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('links', { id: 'sample1' });
  }
};
