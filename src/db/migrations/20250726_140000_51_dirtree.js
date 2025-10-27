export function up(knex) {
  return knex.schema.createTable('dirtree', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('parent_id').notNullable();
    table.bigInteger('child_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['parent_id', 'child_id']);
    table.index(['child_id']);
  }).then(() => {
    // create root entry
    return knex('dirtree').insert({
      id: -1,
      parent_id: -2,
      child_id: -1,
    });
  });
}

export function down(knex) {
  return knex.schema.dropTable('dirtree');
}
