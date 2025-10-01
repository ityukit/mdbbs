export function up(knex) {
  return knex.schema.createTable('resources', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.bigInteger('target').notNullable();
    table.bigInteger('target_id').notNullable();
    table.bigInteger('inheritance_id').notNullable();

    table.unique(['target', 'target_id']);
    table.index(['inheritance_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('resources');
}
