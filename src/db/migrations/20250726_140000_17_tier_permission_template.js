export function up(knex) {
  return knex.schema.createTable('tier_permission_template', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.bigInteger('tier_id').notNullable();
    table.bigInteger('action').notNullable();
    table.boolean('is_allow').notNullable().defaultTo(true);

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['tier_id', 'action']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('tier_permission_template');
}
