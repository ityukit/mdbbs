export function up(knex) {
  return knex.schema.createTable('user_self_rules', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('action_id').notNullable();
    table.boolean('is_allow').notNullable().defaultTo(true);

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['action_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('user_self_rules');
}
