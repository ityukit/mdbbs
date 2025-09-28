export function up(knex) {
  return knex.schema.createTable('list_permissions', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('target').notNullable();
    table.bigInteger('target_id').notNullable();
    table.bigInteger('permission_id').notNullable();
    table.bigInteger('unit').notNullable();
    table.bigInteger('unit_id').notNullable();
    table.boolean('is_allow').notNullable();
    table.bigInteger('orderno').notNullable();
    
    table.bigInteger('created_by').notNullable().defaultTo(-1);
    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['target', 'target_id', 'permission_id','orderno']);
    table.index(['target', 'target_id', 'permission_id','unit', 'unit_id','orderno']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('list_permissions');
}
