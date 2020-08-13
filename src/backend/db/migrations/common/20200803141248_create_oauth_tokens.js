import { onUpdateTrigger } from '../../../utils/updateTimestamp.js';

export function up(knex) {
  return knex.schema
    .createTable('oauth_tokens', table => {
      table
        .increments('id')
        .primary()
        .unsigned();
      table.integer('user_id').notNullable();
      // .defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('access_token').notNullable();
      table
        .timestamp('access_token_expires_at', { useTz: false })
        .notNullable();
      table.string('client_id').notNullable();
      table.string('refresh_token').notNullable();
      table
        .timestamp('refresh_token_expires_at', { useTz: false })
        .notNullable();
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
