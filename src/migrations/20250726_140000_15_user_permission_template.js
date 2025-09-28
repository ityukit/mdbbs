export function up(knex) {
  return knex.schema.createTable('user_permission_template', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.bigInteger('user_id').notNullable();
    table.bigInteger('action').notNullable();
    table.boolean('is_allow').notNullable().defaultTo(true);

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['user_id', 'action']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('user_permission_template');
}
