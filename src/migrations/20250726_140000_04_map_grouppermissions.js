export function up(knex) {
  return knex.schema.createTable('map_grouppermissions', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('group_id').notNullable();
    table.bigInteger('permission_id').notNullable();
    table.boolean('allow').notNullable().defaultTo(true); // true: allow, false: deny

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['group_id', 'permission_id']);
    table.index(['permission_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_grouppermissions');
}
