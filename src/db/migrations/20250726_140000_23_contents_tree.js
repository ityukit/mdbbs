export function up(knex) {
  return knex.schema.createTable('contents_tree', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('parent_id').notNullable();
    table.bigInteger('child_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['parent_id', 'child_id']);
    table.index(['child_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('contents_tree');
}
