import bcrypt from 'bcryptjs';

export function seed(knex) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync('averylongandgoodpassword', salt);
  return knex('users')
    .del()
    .then(function() {
      // Inserts seed entries
      return Promise.all([
        knex('users').insert([
          {
            id: 1,
            username: 'admin',
            password: hash,
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@mlbn.org',
            phone: '1-555-867-5309',
            extension: '111',
          },
          {
            id: 2,
            username: 'editor',
            password: hash,
            firstName: 'Rae',
            lastName: 'Gaines',
            email: 'rae@throneless.tech',
            phone: '1-555-867-5309',
            extension: '112',
          },
          {
            id: 3,
            username: 'viewer',
            password: hash,
            firstName: 'Bobby',
            lastName: 'Tables',
            email: 'bobby@example.com',
            phone: '1-555-867-5309',
            extension: '113',
          },
        ]),
        knex('instance_users').insert([
          {
            uid: 1,
            iid: 1,
          },
          {
            uid: 2,
            iid: 2,
          },
          {
            uid: 3,
            iid: 1,
          },
        ]),
      ]);
    });
}
