export function up(knex) {
  return knex.schema.createTable('map_usergroup', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('user_id').notNullable();
    table.bigInteger('group_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['user_id', 'group_id']);
    table.index(['group_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_usergroup');
}
