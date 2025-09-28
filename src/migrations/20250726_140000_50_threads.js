export function up(knex) {
  return knex.schema.createTable('threads', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('thread_id').notNullable().unique();
    table.text('title').notNullable();

    table.bigInteger('dirtree_id').notNullable();
    table.bigInteger('contents_id').notNullable();

    table.bigInteger('status').notNullable();

    table.boolean('visibled').notNullable().defaultTo(true);
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('locked').notNullable().defaultTo(false);

    table.bigint('first_sort_key').notNullable().defaultTo(0);
    table.text('second_sort_key').notNullable().defaultTo('');


    table.bigint('created_user_id').notNullable();
    table.bigint('updated_user_id').notNullable();
    table.bigint('last_updated_user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    table.timestamp('updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));
    table.timestamp('last_updated_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['dirtree_id', 'contents_id']);
    table.index(['dirtree_id','title']);
    table.index(['dirtree_id','status']);
    table.index(['dirtree_id','created_user_id']);
    table.index(['dirtree_id','updated_user_id']);
    table.index(['dirtree_id','last_updated_user_id']);
    table.index(['dirtree_id','created_at']);
    table.index(['dirtree_id','updated_at']);
    table.index(['dirtree_id','last_updated_at']);
    table.index(['contents_id']);
    table.index(['title']);
    table.index(['status']);
    table.index(['created_user_id']);
    table.index(['updated_user_id']);
    table.index(['last_updated_user_id']);
    table.index(['created_at']);
    table.index(['updated_at']);
    table.index(['last_updated_at']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('threads');
}
