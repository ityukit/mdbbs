export function up(knex) {
  return knex.schema.createTable('context_copyto', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('context_id').notNullable().unique();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
  });
}

export function down(knex) {
  return knex.schema.dropTable('context_copyto');
}
