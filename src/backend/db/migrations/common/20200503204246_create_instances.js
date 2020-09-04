import { onUpdateTrigger } from '../../../utils/updateTimestamp.js';

export function up(knex) {
  return Promise.all([
    knex.schema
      .createTable('instances', table => {
        table
          .increments('id')
          .primary()
          .unsigned();
        table
          .string('domain')
          .unique()
          .index()
          .notNullable();
        table.string('name').unique();
        table.text('secret');
        table.text('redirect_uri');
        table.timestamps(true, true);
      })
      .then(() =>
        knex.raw(
          onUpdateTrigger(knex.context.client.config.client, 'instances'),
        ),
      ),
    knex.schema.createTable('instance_users', table => {
      table.integer('iid').index();
      table
        .foreign('iid')
        .references('id')
        .inTable('instances')
        .onDelete('CASCADE');
      table.integer('uid').index();
      table
        .foreign('uid')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
    }),
  ]);
}

export function down(knex) {
  return Promise.all([
    knex.schema.dropTable('instances'),
    knex.schema.dropTable('instance_users'),
  ]);
}
