export function up(knex) {
  return knex.schema.createTable('tier_rules', function createTable(table) {
    table.bigIncrements('id').primary();
    
    table.bigInteger('tier_id').notNullable();
    table.bigInteger('action_id').notNullable();
    table.boolean('is_allow').notNullable().defaultTo(true);

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['tier_id', 'action_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('tier_rules');
}
