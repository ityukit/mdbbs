export function up(knex) {
  return knex.schema.createTable('permissions', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('permission_id').notNullable().unique();
    table.text('display_name').notNullable();
    table.text('description');

    table.timestamp('updated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.index(['display_name']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('permissions');
}
