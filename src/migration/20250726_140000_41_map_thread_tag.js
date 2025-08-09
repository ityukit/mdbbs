import { TableBuilder } from "knex";

export function up(knex) {
  return knex.schema.createTable('map_thread_tag', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('thread_id').notNullable();
    table.bigInteger('tag_id').notNullable();

    table.bigint('created_user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['thread_id', 'tag_id']);
    table.index(['tag_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_thread_tag');
}
