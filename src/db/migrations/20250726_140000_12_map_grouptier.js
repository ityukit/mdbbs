export function up(knex) {
  return knex.schema.createTable('map_grouptier', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('tier_id').notNullable();
    table.bigInteger('group_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['group_id', 'tier_id']);
    table.index(['tier_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_grouptier');
}
