import { onUpdateTrigger } from '../../../utils/updateTimestamp.js';

export function up(knex) {
  return knex.schema
    .createTable('oauth_clients', table => {
      table
        .increments('id')
        .primary()
        .unsigned();
      table.string('client_id').notNullable();
      table.string('client_secret').notNullable();
      table.string('redirect_uri').notNullable();
      table.timestamps(true, true);
    })
    .then(() =>
      knex.raw(
        onUpdateTrigger(knex.context.client.config.client, 'oauth_clients'),
      ),
    );
}

export function down(knex) {
  return knex.schema.dropTable('oauth_clients');
}
