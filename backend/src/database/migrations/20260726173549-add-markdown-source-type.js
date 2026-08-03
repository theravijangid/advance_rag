'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_sources_type" ADD VALUE IF NOT EXISTS 'markdown';
    `);
  },

  async down (queryInterface, Sequelize) {
    console.log('Cannot remove ENUM value "markdown" in down migration. Value remains in ENUM.');
  }
};
