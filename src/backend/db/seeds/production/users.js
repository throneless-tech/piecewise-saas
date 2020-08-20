import bcrypt from 'bcryptjs';

export function seed(knex) {
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync('averylongandgoodpassword', salt);
  return knex('users')
    .del()
    .then(() => {
      // Inserts seed entries
      return knex('users').insert([
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
      ]);
    })
    .then(() => {
      return knex('user_groups').del();
    })
    .then(() => {
      // Inserts seed entries
      return knex('user_groups').insert([
        {
          gid: 1,
          uid: 1,
        },
      ]);
    });
}
