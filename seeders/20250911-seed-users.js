'use strict';
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const passwordAdmin = await bcrypt.hash('admin12345', 10);
    const passwordUser = await bcrypt.hash('user12345', 10);

    const users = [
      {
        name: faker.person.fullName(),
        username: 'admin',
        password_hash: passwordAdmin,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: faker.person.fullName(),
        username: 'user',
        password_hash: passwordUser,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    for (let i = 0; i < 4998; i++) {
      const randomPassword = await bcrypt.hash(faker.internet.password({ length: 8 }), 10);
      const username = faker.person.firstName() + faker.person.lastName() + i; // username unik
      users.push({
        name: faker.person.fullName(),
        username: username,
        password_hash: randomPassword,
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    await queryInterface.bulkInsert('users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
