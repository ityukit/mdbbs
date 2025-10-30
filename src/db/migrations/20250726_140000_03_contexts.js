export function up(knex) {
  return knex.schema.createTable('contexts', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.text('name');
    table.bigInteger('parent_id').notNullable();
    table.boolean('enabled').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['name']);
    table.index(['id','parent_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('contexts');
}
