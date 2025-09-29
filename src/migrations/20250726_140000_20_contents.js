export function up(knex) {
  return knex.schema.createTable('contents', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('title').notNullable();
    table.bigint('revision').notNullable(); // if revision < 0, it is a draft
    table.text('contents').notNullable();
    table.text('parser');
    table.text('description');
    table.boolean('visibled').notNullable().defaultTo(true);
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('locked').notNullable().defaultTo(false);
    table.boolean('deleted').notNullable().defaultTo(false);
    table.bigint('updated_user_id').notNullable();
    table.bigint('created_user_id').notNullable();

    table.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.index(['title']);
    table.index(['updated_user_id']);
    table.index(['created_user_id']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('contents');
}
