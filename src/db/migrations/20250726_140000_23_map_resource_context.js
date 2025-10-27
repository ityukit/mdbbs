export function up(knex) {
  return knex.schema.createTable('map_resource_context', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('resource_id').notNullable();
    table.bigInteger('context_id').notNullable();

    table.unique(['resource_id', 'context_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_resource_context');
}
