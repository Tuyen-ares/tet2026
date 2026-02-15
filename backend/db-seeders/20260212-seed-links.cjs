"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("links", [
      {
        id: "sample1",
        name: "Nguoi Yeu",
        wish: "Chuc mung nam moi, {name}!",
        min: 1000,
        max: 10000,
        audio: "",
        sender: "Anh",
        receiver: "Em",
        type: "basic",
        created_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("links", { id: "sample1" });
  },
};
