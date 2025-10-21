export function up(knex) {
  return knex.schema.createTable('permission_inheritance', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.text('name');
    table.bigInteger('parent_id').notNullable();

    table.unique(['name']);
    table.index(['id','parent_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('permission_inheritance');
}
