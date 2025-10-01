export function up(knex) {
  return knex.schema.createTable('tags', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('tag_id').notNullable().unique();
    table.text('display_name').notNullable();
    table.text('description');
    table.boolean('visibled').notNullable().defaultTo(true);
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('locked').notNullable().defaultTo(false);

    table.bigint('updated_user_id').notNullable();
    table.bigint('created_user_id').notNullable();

    table.timestamp('updated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.index(['display_name']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('tags');
}
