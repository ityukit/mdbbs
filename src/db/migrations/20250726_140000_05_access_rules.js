export function up(knex) {
  return knex.schema.createTable('access_rules', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('inheritance_id').notNullable();
    table.bigInteger('action').notNullable();
    table.bigInteger('unit').notNullable();
    table.bigInteger('unit_id').notNullable();
    table.boolean('is_allow').notNullable();
    table.bigInteger('orderno').notNullable();
    table.bigInteger('source').notNullable();
    table.bigInteger('source_id').notNullable();
    
    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['inheritance_id', 'action', 'orderno']);
    table.index(['inheritance_id', 'action', 'unit', 'unit_id', 'orderno']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('access_rules');
}
