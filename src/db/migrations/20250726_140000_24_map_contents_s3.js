export function up(knex) {
  return knex.schema.createTable('map_contents_s3', function createTable(table) {
    table.bigIncrements('id').primary();

    table.bigInteger('content_id').notNullable();
    table.text('s3_path').notNullable();
    table.text('s3_ext_url').notNullable();

    table.bigint('created_user_id').notNullable();

    table.timestamp('created_at', { precision: 6 }).defaultTo(knex.fn.now(6));

    table.unique(['content_id', 's3_path']);
    table.index(['s3_path']);
    table.index(['s3_ext_url']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('map_contents_s3');
}
