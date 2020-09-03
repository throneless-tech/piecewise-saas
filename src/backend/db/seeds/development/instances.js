export function seed(knex) {
  return knex('instances')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('instances').insert([
        {
          id: 1,
          name: 'piecewise1',
          domain: 'piecewise1.localhost',
          secret: 'secret',
          redirect_uri: 'http://localhost:3001/api/v1/oauth2/callback',
        },
        {
          id: 2,
          name: 'piecewise2',
          domain: 'piecewise2.localhost',
          secret: 'secret',
          redirect_uri: 'http://localhost:3002/api/v1/oauth2/callback',
        },
      ]);
    });
}
