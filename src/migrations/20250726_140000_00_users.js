export function up(knex) {
  return knex.schema.createTable('users', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('login_id').unique(); // if null, user deleted
    table.text('hashed_password'); // if null, can't login
    table.text('display_name').notNullable();
    table.text('email');
    table.text('description');
    table.boolean('visibled').notNullable().defaultTo(true);
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('locked').notNullable().defaultTo(false);
    table.boolean('activated').notNullable().defaultTo(false);
    table.boolean('verified_email').notNullable().defaultTo(false);

    table.text('mfa_data');
    table.boolean('mfa_enabled').notNullable().defaultTo(false);

    table.text('user_data');

    table.timestamp('passupdated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.timestamp('updated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.index(['display_name']);
    table.index(['email']);
  });
}

export function down(knex) {
  return knex.schema.dropTable('users');
}
