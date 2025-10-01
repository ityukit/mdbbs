
async function insert(    trx, name, action, is_allow) {
  const tierid = await trx.select('id').from('tiers').where('name',name).first();
  const actionid = await trx.select('id').from('permissions').where('permission_id',action).first();
  if(tierid && actionid){
    const c = await trx.select('id').from('tier_permission_template').where({tier_id:tierid.id, action:actionid.id}).first();
    if(!c){
      console.log(`Inserting tier_permission_template ${name} ${action} ${is_allow}`);
      await trx('tier_permission_template').insert(    {
        tier_id: tierid.id,
        action: actionid.id,
        is_allow: is_allow,
      });
    }
  }
}
async function insertSelf(trx, action, is_allow) {
  const actionid = await trx.select('id').from('permissions').where('permission_id',action).first();
  if(actionid){
    const c = await trx.select('id').from('user_self_permission_template').where({ action:actionid.id}).first();
    if(!c){
      console.log(`Inserting user_self_permission_template ${action} ${is_allow}`);
      await trx('user_self_permission_template').insert(    {
        action: actionid.id,
        is_allow: is_allow,
      });
    }
  }
}

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    await insert(    trx, 'guest',     'tree.list', true);
    await insert(    trx, 'moderator', 'tree.list', true);
    await insertSelf(trx,              'tree.list', true);
    await insert(    trx, 'guest',     'tree.get', true);
    await insert(    trx, 'moderator', 'tree.get', true);
    await insertSelf(trx,              'tree.get', true);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_visible', true);
    await insertSelf(trx,              'tree.getwithstatus_visible', true);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_enable', true);
    await insertSelf(trx,              'tree.getwithstatus_enable', true);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_lock', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_lock', true);
    await insertSelf(trx,              'tree.getwithstatus_lock', true);
    await insert(    trx, 'user',      'tree.create', true);
    await insert(    trx, 'admin',     'tree.update_title', true);
    await insertSelf(trx,              'tree.update_title', true);
    await insert(    trx, 'admin',     'tree.update_description', true);
    await insertSelf(trx,              'tree.update_description', true);
    await insert(    trx, 'moderator', 'tree.updatestatus_visible', true);
    await insertSelf(trx,              'tree.updatestatus_visible', true);
    await insert(    trx, 'moderator', 'tree.updatestatus_enable', true);
    await insertSelf(trx,              'tree.updatestatus_enable', true);
    await insert(    trx, 'poweruser', 'tree.updatestatus_lock', true);
    await insert(    trx, 'owner',     'tree.delete', true);
    await insert(    trx, 'poweruser', 'tree.move', true);
    await insertSelf(trx,              'tree.move', true);
    await insert(    trx, 'poweruser', 'tree.getDefault', true);
    await insert(    trx, 'poweruser', 'tree.updateDefault', true);
    await insert(    trx, 'poweruser', 'tree.deleteDefault', true);
    await insert(    trx, 'admin',     'tree.permission_read', true);
    await insert(    trx, 'admin',     'tree.permission_change', true);
    await insert(    trx, 'guest',     'thread.list', true);
    await insert(    trx, 'moderator', 'thread.list', true);
    await insertSelf(trx,              'thread.list', true);
    await insert(    trx, 'guest',     'thread.get', true);
    await insert(    trx, 'moderator', 'thread.get', true);
    await insertSelf(trx,              'thread.get', true);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'thread.getwithstatus_visible', true);
    await insertSelf(trx,              'thread.getwithstatus_visible', true);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'thread.getwithstatus_enable', true);
    await insertSelf(trx,              'thread.getwithstatus_enable', true);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_lock', true);
    await insertSelf(trx,              'thread.getwithstatus_lock', true);
    await insert(    trx, 'user',      'thread.create', true);
    await insert(    trx, 'admin',     'thread.update_title', true);
    await insertSelf(trx,              'thread.update_title', true);
    await insert(    trx, 'admin',     'thread.update_description', true);
    await insertSelf(trx,              'thread.update_description', true);
    await insert(    trx, 'poweruser', 'thread.updatestatus_visible', true);
    await insert(    trx, 'moderator', 'thread.updatestatus_visible', true);
    await insertSelf(trx,              'thread.updatestatus_visible', true);
    await insert(    trx, 'poweruser', 'thread.updatestatus_enable', true);
    await insert(    trx, 'moderator', 'thread.updatestatus_enable', true);
    await insertSelf(trx,              'thread.updatestatus_enable', true);
    await insert(    trx, 'poweruser', 'thread.updatestatus_lock', true);
    await insert(    trx, 'owner',     'thread.delete', true);
    await insert(    trx, 'poweruser', 'thread.move', true);
    await insertSelf(trx,              'thread.move', true);
    await insert(    trx, 'poweruser', 'thread.getDefault', true);
    await insert(    trx, 'poweruser', 'thread.updateDefault', true);
    await insert(    trx, 'poweruser', 'thread.deleteDefault', true);
    await insert(    trx, 'admin',     'thread.permission_read', true);
    await insert(    trx, 'admin',     'thread.permission_change', true);
    await insert(    trx, 'guest',     'content.list', true);
    await insertSelf(trx,              'content.list', true);
    await insert(    trx, 'guest',     'content.get', true);
    await insertSelf(trx,              'content.get', true);
    await insert(    trx, 'poweruser', 'content.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'content.getwithstatus_visible', true);
    await insertSelf(trx,              'content.getwithstatus_visible', true);
    await insert(    trx, 'poweruser', 'content.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'content.getwithstatus_enable', true);
    await insertSelf(trx,              'content.getwithstatus_enable', true);
    await insert(    trx, 'poweruser', 'content.getwithstatus_lock', true);
    await insertSelf(trx,              'content.getwithstatus_lock', true);
    await insert(    trx, 'user',      'content.create', true);
    await insert(    trx, 'admin',     'content.update_title', true);
    await insertSelf(trx,              'content.update_title', true);
    await insert(    trx, 'admin',     'content.update_description', true);
    await insertSelf(trx,              'content.update_description', true);
    await insert(    trx, 'poweruser', 'content.updatestatus_visible', true);
    await insert(    trx, 'moderator', 'content.updatestatus_visible', true);
    await insertSelf(trx,              'content.updatestatus_visible', true);
    await insert(    trx, 'poweruser', 'content.updatestatus_enable', true);
    await insert(    trx, 'moderator', 'content.updatestatus_enable', true);
    await insertSelf(trx,              'content.updatestatus_enable', true);
    await insert(    trx, 'poweruser', 'content.updatestatus_lock', true);
    await insert(    trx, 'owner',     'content.delete', true);
    await insert(    trx, 'poweruser', 'content.move', true);
    await insertSelf(trx,              'content.move', true);
    await insert(    trx, 'poweruser', 'content.getDefault', true);
    await insert(    trx, 'poweruser', 'content.updateDefault', true);
    await insert(    trx, 'poweruser', 'content.deleteDefault', true);
    await insert(    trx, 'admin',     'content.permission_read', true);
    await insert(    trx, 'admin',     'content.permission_change', true);
    await insert(    trx, 'poweruser', 'tree.getsortkey', true);
    await insertSelf(trx,              'tree.getsortkey', true);
    await insert(    trx, 'poweruser', 'tree.setsortkey', true);
    await insertSelf(trx,              'tree.setsortkey', true);
    await insert(    trx, 'poweruser', 'tree.setsortkey_range', true);
    await insert(    trx, 'poweruser', 'thread.getsortkey', true);
    await insertSelf(trx,              'thread.getsortkey', true);
    await insert(    trx, 'poweruser', 'thread.setsortkey', true);
    await insertSelf(trx,              'thread.setsortkey', true);
    await insert(    trx, 'poweruser', 'thread.setsortkey_range', true);
    await insert(    trx, 'guest',     'thread.tag_list', true);
    await insert(    trx, 'moderator', 'thread.tag_list', true);
    await insertSelf(trx,              'thread.tag_list', true);
    await insert(    trx, 'guest',     'thread.tag_get', true);
    await insert(    trx, 'moderator', 'thread.tag_get', true);
    await insertSelf(trx,              'thread.tag_get', true);
    await insert(    trx, 'user',      'thread.tag_create', true);
    await insert(    trx, 'poweruser', 'thread.tag_update', true);
    await insert(    trx, 'owner',     'thread.tag_delete', true);
    await insert(    trx, 'admin',     'content.update_contents', true);
    await insertSelf(trx,              'content.update_contents', true);
    await insert(    trx, 'admin',     'content.viewlogs', true);
    await insert(    trx, 'moderator', 'content.viewlogs', true);
    await insert(    trx, 'poweruser', 'user.list', true);
    await insert(    trx, 'guest',     'user.get', true);
    await insert(    trx, 'moderator', 'user.get', true);
    await insert(    trx, 'admin',     'user.getwithstatus_visible', true);
    await insert(    trx, 'admin',     'user.getwithstatus_enable', true);
    await insert(    trx, 'admin',     'user.getwithstatus_lock', true);
    await insert(    trx, 'poweruser', 'user.getDetails', true);
    await insert(    trx, 'moderator', 'user.getDetails', true);
    await insertSelf(trx,              'user.getDetails', true);
    await insert(    trx, 'admin',     'user.create', true);
    await insert(    trx, 'admin',     'user.update_name', true);
    await insertSelf(trx,              'user.update_name', true);
    await insert(    trx, 'admin',     'user.update_description', true);
    await insertSelf(trx,              'user.update_description', true);
    await insert(    trx, 'admin',     'user.updatestatus_visible', true);
    await insert(    trx, 'admin',     'user.updatestatus_enable', true);
    await insert(    trx, 'admin',     'user.updatestatus_lock', true);
    await insert(    trx, 'admin',     'user.permission_read', true);
    await insert(    trx, 'admin',     'user.permission_change', true);
    await insert(    trx, 'poweruser', 'group.list', true);
    await insert(    trx, 'guest',     'group.get', true);
    await insert(    trx, 'moderator', 'group.get', true);
    await insert(    trx, 'admin',     'group.getwithstatus_visible', true);
    await insert(    trx, 'admin',     'group.getwithstatus_enable', true);
    await insert(    trx, 'admin',     'group.getwithstatus_lock', true);
    await insert(    trx, 'poweruser', 'group.getDetails', true);
    await insert(    trx, 'moderator', 'group.getDetails', true);
    await insertSelf(trx,              'group.getDetails', true);
    await insert(    trx, 'admin',     'group.create', true);
    await insert(    trx, 'admin',     'group.update_name', true);
    await insert(    trx, 'admin',     'group.update_description', true);
    await insert(    trx, 'admin',     'group.updatestatus_visible', true);
    await insert(    trx, 'admin',     'group.updatestatus_enable', true);
    await insert(    trx, 'admin',     'group.updatestatus_lock', true);
    await insert(    trx, 'admin',     'group.permission_read', true);
    await insert(    trx, 'admin',     'group.permission_change', true);
    await insert(    trx, 'owner',     'user.setpassword', true);
    await insertSelf(trx,              'user.setpassword', true);
    await insert(    trx, 'owner',     'user.force_setpassword', true);
    await insert(    trx, 'owner',     'user.setemail', true);
    await insertSelf(trx,              'user.setemail', true);
    await insert(    trx, 'admin',     'group.adduser', true);
    await insert(    trx, 'admin',     'group.removeuser', true);
    await insert(    trx, 'admin',     'group.addgroup', true);
    await insert(    trx, 'admin',     'group.removegroup', true);
    await insert(    trx, 'owner',     'change_permission.permission_inheritance', true);
    await insert(    trx, 'owner',     'change_permission.user_permission_template', true);
    await insert(    trx, 'owner',     'change_permission.group_permission_template', true);
    await insert(    trx, 'owner',     'change_permission.user_self_permission_template', true);
    await insert(    trx, 'owner',     'tier.create', true);
    await insert(    trx, 'owner',     'tier.delete', true);
    await insert(    trx, 'owner',     'tier.change_name', true);
    await insert(    trx, 'owner',     'tier.change_template', true);
    await insert(    trx, 'owner',     'tier.user_add', true);
    await insert(    trx, 'owner',     'tier.user_remove', true);
    await insert(    trx, 'owner',     'tier.group_add', true);
    await insert(    trx, 'owner',     'tier.group_remove', true);
  });
}
