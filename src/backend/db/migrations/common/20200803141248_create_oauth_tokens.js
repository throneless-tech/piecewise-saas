import { onUpdateTrigger } from '../../../utils/updateTimestamp.js';

export function up(knex) {
  return Promise.all([
    knex.schema
      .createTable('oauth_tokens', table => {
        table
          .increments('id')
          .primary()
          .unsigned();
        // .defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('access_token').notNullable();
        table
          .timestamp('access_token_expires_at', { useTz: false })
          .notNullable();
        table.string('refresh_token').notNullable();
        table
          .timestamp('refresh_token_expires_at', { useTz: false })
          .notNullable();
        table.string('scope');
        table.integer('client_id').index();
        table
          .foreign('client_id')
          .references('id')
          .inTable('instances')
          .onDelete('CASCADE');
        table.integer('user_id').index();
        table
          .foreign('user_id')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.timestamps(true, true);
      })
      .then(() =>
        knex.raw(
          onUpdateTrigger(knex.context.client.config.client, 'oauth_tokens'),
        ),
      ),
    knex.schema
      .createTable('oauth_codes', table => {
        table
          .increments('id')
          .primary()
          .unsigned();
        // .defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('code').notNullable();
        table.timestamp('expires_at', { useTz: false }).notNullable();
        table.string('redirect_uri').notNullable();
        table.string('scope');
        table.integer('client_id').index();
        table
          .foreign('client_id')
          .references('id')
          .inTable('instances')
          .onDelete('CASCADE');
        table.integer('user_id').index();
        table
          .foreign('user_id')
          .references('id')
          .inTable('users')
          .onDelete('CASCADE');
        table.timestamps(true, true);
      })
      .then(() =>
        knex.raw(
          onUpdateTrigger(knex.context.client.config.client, 'oauth_codes'),
        ),
      ),
  ]);
}

export function down(knex) {
  return Promise.all([
    knex.schema.dropTable('oauth_tokens'),
    knex.schema.dropTable('oauth_codes'),
  ]);
}
