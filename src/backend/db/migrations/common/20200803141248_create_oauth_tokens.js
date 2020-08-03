import { onUpdateTrigger } from '../../../utils/updateTimestamp.js';

export function up(knex) {
  return knex.schema
    .createTable('oauth_tokens', table => {
      table
        .increments('id')
        .primary()
        .unsigned();
      table
        .uuid('id')
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable();
      table
        .uuid('user_id')
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .notNullable();
      table.string('access_token').notNullable();
      table.timestamps('access_token_expires_on').notNullable();
      table.string('client_id').notNullable();
      table.string('refresh_token').notNullable();
      table.timestamps('refresh_token_expires_on').notNullable();
      table.timestamps(true, true);
    })
    .then(() =>
      knex.raw(
        onUpdateTrigger(knex.context.client.config.client, 'oauth_tokens'),
      ),
    );
}

export function down(knex) {
  return knex.schema.dropTable('oauth_tokens');
}
