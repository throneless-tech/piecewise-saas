export function seed(knex) {
  return knex('instances')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('instances').insert([
        {
          id: 1,
          domain: 'test1.measuringbroadband.org',
          secret: '1234567890',
          redirect_uri: 'https://test1.measuringbroadband.org',
        },
        {
          id: 2,
          domain: 'test2.measuringbroadband.org',
          secret: '1234567890',
          redirect_uri: 'https://test2.measuringbroadband.org',
        },
      ]);
    });
}
