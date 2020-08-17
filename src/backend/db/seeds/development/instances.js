export function seed(knex) {
  return knex('instances')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('instances').insert([
        {
          id: 1,
          domain: 'piecewise1.localhost',
          secret: '1234567890',
          redirect_uri: 'http://piecewise1.localhost:3001',
        },
        {
          id: 2,
          domain: 'piecewise2.localhost',
          secret: '1234567890',
          redirect_uri: 'http://piecewise2.localhost:3002',
        },
      ]);
    });
}
