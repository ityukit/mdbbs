export function up(knex) {
  return knex.schema.createTable('dirs', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('dir_id').notNullable().unique();
    table.text('display_name').notNullable();
    table.text('description');
    table.boolean('visibled').notNullable().defaultTo(true);
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('locked').notNullable().defaultTo(false);
    table.boolean('deleted').notNullable().defaultTo(false);

    table.bigint('first_sort_key').notNullable().defaultTo(0);
    table.text('second_sort_key').notNullable().defaultTo('');

    table.bigint('updated_user_id').notNullable();
    table.bigint('created_user_id').notNullable();

    table.timestamp('updated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.index(['display_name']);
  }).then(() => {
    // create root entry
    return knex('dirs').insert({
      id: -1,
      dir_id: 'root',
      display_name: 'Root',
      description: 'Root Directory',
      visibled: true,
      enabled: true,
      first_sort_key: 0,
      second_sort_key: '',
      updated_user_id: -1,
      created_user_id: -1,
    });
  });
}

export function down(knex) {
  return knex.schema.dropTable('dirs');
}
