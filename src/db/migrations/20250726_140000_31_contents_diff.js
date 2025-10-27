export function up(knex) {
  return knex.schema.createTable('contents_diff', function createTable(table) {
    table.bigIncrements('id').primary();
    table.bigint('contents_id').notNullable();
    table.bigint('revision').notNullable();
    table.text('title').notNullable();

    table.boolean('directed').notNullable().defaultTo(false);
    table.boolean('compressed').notNullable().defaultTo(false);
    table.binary('diff').notNullable();

    table.text('parser');
    table.text('description');
    table.bigint('created_user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['contents_id', 'revision']);
    table.index(['contents_id','directed']);
    table.index(['created_user_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('contents_diff');
}
