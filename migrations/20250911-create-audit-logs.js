"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      actor_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      entity: { type: Sequelize.STRING(50), allowNull: false },
      entity_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      action: { type: Sequelize.STRING(20), allowNull: false },
      before: { type: Sequelize.JSON, allowNull: true },
      after: { type: Sequelize.JSON, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("audit_logs");
  },
};
