export function up(knex) {
  return knex.schema.createTable('permissions', function createTable(table) {
    table.bigIncrements('id').primary();
    table.text('permission_id').notNullable().unique();
    table.text('display_name').notNullable();
    table.text('description');

    table.timestamp('updated_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));
    table.timestamp('created_at', { precision: 6 }).notNullable().defaultTo(knex.fn.now(6));

    table.index(['display_name']);
  }).then(() => {
    const i18n_prefix = 'permission.';
    // for contents
    for(const ctype of ['tree','thread','content']){
      for(const action of ['list','get','create','update','delete','move','getDefault','updateDefault','deleteDefault']){
        knex('permissions').insert({
          permission_id: `${ctype}.${action}`,
          display_name: `${i18n_prefix}.${ctype}.${action}`,
          description: `${i18n_prefix}.${ctype}.${action}.desc`,
        });
      }
    }
    for(const ctype of ['thread','content']){
      for(const action of ['update_title','update_contents','getsortkey','setsortkey','setsortkey_range']){
        knex('permissions').insert({
          permission_id: `${ctype}.${action}`,
          display_name: `${i18n_prefix}.${ctype}.${action}`,
          description: `${i18n_prefix}.${ctype}.${action}.desc`,
        });
      }
    }
    for(const ctype of ['thread']){
      for(const action of ['tag_list','tag_get','tag_create','tag_update','tag_delete']){
        knex('permissions').insert({
          permission_id: `${ctype}.${action}`,
          display_name: `${i18n_prefix}.${ctype}.${action}`,
          description: `${i18n_prefix}.${ctype}.${action}.desc`,
        });
      }
    }
    // for usergroup
    for(const utype of ['user','group']){
      for(const action of ['list','get','getDetails','create','update','delete']){
        knex('permissions').insert({
          permission_id: `${utype}.${action}`,
          display_name: `${i18n_prefix}.${utype}.${action}`,
          description: `${i18n_prefix}.${utype}.${action}.desc`,
        });
      }
    }
    for(const utype of ['user']){
      for(const action of ['reset_password']){
        knex('permissions').insert({
          permission_id: `${utype}.${action}`,
          display_name: `${i18n_prefix}.${utype}.${action}`,
          description: `${i18n_prefix}.${utype}.${action}.desc`,
        });
      }
    }
    for(const utype of ['group']){
      for(const action of ['adduser','removeuser','addgroup','removegroup']){
        knex('permissions').insert({
          permission_id: `${utype}.${action}`,
          display_name: `${i18n_prefix}.${utype}.${action}`,
          description: `${i18n_prefix}.${utype}.${action}.desc`,
        });
      }
    }
  });
}

export function down(knex) {
  return knex.schema.dropTable('permissions');
}
