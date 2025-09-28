export function up(knex) {
  return knex.schema.createTable('tiers', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.text('name').notNullable();
    table.bigInteger('parent_id').notNullable();

    table.unique(['name']);
    table.index(['id','parent_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('tiers');
}
