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
    knex('permissions').insert([
      // constants permissions
      {
        permission_id: 'get',
        display_name: 'get',
        description: 'get(read) permission',
      },
      {
        permission_id: 'list',
        display_name: 'list',
        description: 'list(find) permission',
      },
      {
        permission_id: 'create',
        display_name: 'create',
        description: 'create permission',
      },
      {
        permission_id: 'update',
        display_name: 'update',
        description: 'update permission',
      },
      {
        permission_id: 'update_any',
        display_name: 'update any',
        description: 'update any permission',
      },
      {
        permission_id: 'delete',
        display_name: 'delete',
        description: 'delete permission',
      },
      {
        permission_id: 'delete_any',
        display_name: 'delete any',
        description: 'delete any permission',
      },
      // contents s3 permissions
      {
        permission_id: 's3_get',
        display_name: 's3 get',
        description: 's3 get permission',
      },
      {
        permission_id: 's3_list',
        display_name: 's3 list',
        description: 's3 list permission',
      },
      {
        permission_id: 's3_create',
        display_name: 's3 create',
        description: 's3 create permission',
      },
      {
        permission_id: 's3_update',
        display_name: 's3 update',
        description: 's3 update permission',
      },
      {
        permission_id: 's3_delete',
        display_name: 's3 delete',
        description: 's3 delete permission',
      },
      // constants metadata permissions
      {
        permission_id: 'change_visibled',
        display_name: 'change visibled',
        description: 'change contents visibled permission',
      },
      {
        permission_id: 'change_enabled',
        display_name: 'change enabled',
        description: 'change contents enabled permission',
      },
      {
        permission_id: 'change_locked',
        display_name: 'change locked',
        description: 'change contents locked permission',
      },
      // users management permissions
      {
        permission_id: 'user_get',
        display_name: 'user get',
        description: 'user get permission',
      },
      {
        permission_id: 'user_list',
        display_name: 'user list',
        description: 'user list permission',
      },
      {
        permission_id: 'user_create',
        display_name: 'user create',
        description: 'user create permission',
      },
      {
        permission_id: 'user_update',
        display_name: 'user update',
        description: 'user update permission',
      },
      {
        permission_id: 'user_update_visibled',
        display_name: 'user update visibled',
        description: 'user update visibled permission',
      },
      {
        permission_id: 'user_update_enabled',
        display_name: 'user update enabled',
        description: 'user update enabled permission',
      },
      {
        permission_id: 'user_update_reset_password',
        display_name: 'user update reset password',
        description: 'user update reset password permission',
      },
      {
        permission_id: 'user_delete',
        display_name: 'user delete',
        description: 'user delete permission',
      },
      // groups management permissions
      {
        permission_id: 'group_get',
        display_name: 'group get',
        description: 'group get permission',
      },
      {
        permission_id: 'group_list',
        display_name: 'group list',
        description: 'group list permission',
      },
      {
        permission_id: 'group_create',
        display_name: 'group create',
        description: 'group create permission',
      },
      {
        permission_id: 'group_update',
        display_name: 'group update',
        description: 'group update permission',
      },
      {
        permission_id: 'group_update_visibled',
        display_name: 'group update visibled',
        description: 'group update visibled permission',
      },
      {
        permission_id: 'group_update_enabled',
        display_name: 'group update enabled',
        description: 'group update enabled permission',
      },
      {
        permission_id: 'group_delete',
        display_name: 'group delete',
        description: 'group delete permission',
      },
      // groups permissions
      {
        permission_id: 'group_add_permission',
        display_name: 'group add permission',
        description: 'group add permission',
      },
      {
        permission_id: 'group_list_permission',
        display_name: 'group list permission',
        description: 'group list permission',
      },
      {
        permission_id: 'group_delete_permission',
        display_name: 'group delete permission',
        description: 'group delete permission',
      },
      // user groups management permissions
      {
        permission_id: 'user_add_group',
        display_name: 'user add group',
        description: 'user add group permission',
      },
      {
        permission_id: 'user_list_group',
        display_name: 'user list group',
        description: 'user list group permission',
      },
      {
        permission_id: 'user_delete_group',
        display_name: 'user delete group',
        description: 'user delete group permission',
      },
    ]);
  });
}

export function down(knex) {
  return knex.schema.dropTable('permissions');
}
