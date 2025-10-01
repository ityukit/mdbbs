export function up(knex) {
  return knex.schema.createTable('map_contents_unit', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('content_id').notNullable();
    table.bigInteger('unit').notNullable();
    table.bigInteger('unit_id').notNullable();

    table.bigint('created_user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['content_id', 'unit', 'unit_id']);
    table.index(['unit', 'unit_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_contents_unit');
}
