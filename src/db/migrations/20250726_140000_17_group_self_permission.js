export function up(knex) {
  return knex.schema.createTable('group_self_permission', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.bigInteger('action').notNullable();
    table.boolean('is_allow').notNullable().defaultTo(true);

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['action']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('group_self_permission');
}
