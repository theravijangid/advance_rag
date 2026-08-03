'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sources', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('pdf', 'website', 'youtube', 'vtt', 'srt', 'txt'),
        allowNull: false,
      },
      storage_key: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      original_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('UPLOADING', 'QUEUED', 'PARSING', 'CHUNKING', 'EMBEDDING', 'READY', 'FAILED'),
        allowNull: false,
        defaultValue: 'QUEUED',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sources');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sources_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sources_status";');
  }
};
