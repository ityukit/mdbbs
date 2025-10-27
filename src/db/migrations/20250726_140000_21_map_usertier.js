export function up(knex) {
  return knex.schema.createTable('map_usertier', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('context_id').notNullable();
    table.bigInteger('tier_id').notNullable();
    table.bigInteger('user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['user_id', 'context_id', 'tier_id']);
    table.index(['context_id', 'tier_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_usertier');
}
