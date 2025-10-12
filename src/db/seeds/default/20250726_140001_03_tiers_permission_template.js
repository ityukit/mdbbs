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
    }else{
      throw new Error(`tier_permission_template already exists ${name} ${action}`);
    }
  }else{
    throw new Error(`insert: tier or action not found ${name} ${action}`);
  }
}
async function insertSelf(trx, action, is_allow) {
  const actionid = await trx.select('id').from('permissions').where('permission_id',action).first();
  if(actionid){
    const c = await trx.select('id').from('user_self_permission').where({ action:actionid.id}).first();
    if(!c){
      console.log(`Inserting user_self_permission ${action} ${is_allow}`);
      await trx('user_self_permission').insert({
        action: actionid.id,
        is_allow: is_allow,
      });
    }else{
      throw new Error(`user_self_permission already exists ${action}`);
    }
  }else{
    throw new Error(`insertSelf: action not found ${action}`);
  }
}
async function insertSGrp(trx, action, is_allow){
  const actionid = await trx.select('id').from('permissions').where('permission_id',action).first();
  if(actionid){
    const c = await trx.select('id').from('group_self_permission').where({ action:actionid.id}).first();
    if(!c){
      console.log(`Inserting group_self_permission ${action} ${is_allow}`);
      await trx('group_self_permission').insert({
        action: actionid.id,
        is_allow: is_allow,
      });
    }else{
      throw new Error(`group_self_permission already exists ${action}`);
    }
  }else{
    throw new Error(`insertSGrp: action not found ${action}`);
  }
}

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    // DELETE ALL
    // 順序が狂うと意味が変わるのでいったん全部消す
    await trx('tier_permission_template').del();
    await trx('user_self_permission').del();
    await trx('group_self_permission').del();
    // INSERT ALL
    await insert(    trx, 'guest',     'tree.list', true);
    await insert(    trx, 'user',      'tree.list', true);
    await insert(    trx, 'moderator', 'tree.list', true);
    await insertSelf(trx,              'tree.list', true);
    await insertSGrp(trx,              'tree.list', true);
    await insert(    trx, 'guest',     'tree.get', true);
    await insert(    trx, 'user',      'tree.get', true);
    await insert(    trx, 'moderator', 'tree.get', true);
    await insertSelf(trx,              'tree.get', true);
    await insertSGrp(trx,              'tree.get', true);
    await insert(    trx, 'guest',     'tree.getwithstatus_visible', false);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_visible', true);
    await insertSelf(trx,              'tree.getwithstatus_visible', true);
    await insert(    trx, 'guest',     'tree.getwithstatus_enable', false);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_enable', true);
    await insertSelf(trx,              'tree.getwithstatus_enable', true);
    await insert(    trx, 'guest',     'tree.getwithstatus_lock', false);
    await insert(    trx, 'poweruser', 'tree.getwithstatus_lock', true);
    await insert(    trx, 'moderator', 'tree.getwithstatus_lock', true);
    await insertSelf(trx,              'tree.getwithstatus_lock', true);
    await insert(    trx, 'guest',     'tree.create', false);
    await insert(    trx, 'user',      'tree.create', true);
    await insert(    trx, 'guest',     'tree.update_title', false);
    await insert(    trx, 'admin',     'tree.update_title', true);
    await insertSelf(trx,              'tree.update_title', true);
    await insert(    trx, 'guest',     'tree.update_description', false);
    await insert(    trx, 'admin',     'tree.update_description', true);
    await insertSelf(trx,              'tree.update_description', true);
    await insert(    trx, 'guest',     'tree.updatestatus_visible', false);
    await insert(    trx, 'moderator', 'tree.updatestatus_visible', true);
    await insertSelf(trx,              'tree.updatestatus_visible', true);
    await insert(    trx, 'guest',     'tree.updatestatus_enable', false);
    await insert(    trx, 'moderator', 'tree.updatestatus_enable', true);
    await insertSelf(trx,              'tree.updatestatus_enable', true);
    await insert(    trx, 'guest',     'tree.updatestatus_lock', false);
    await insert(    trx, 'poweruser', 'tree.updatestatus_lock', true);
    await insert(    trx, 'guest',     'tree.delete', false);
    await insert(    trx, 'owner',     'tree.delete', true);
    await insert(    trx, 'guest',     'tree.move', false);
    await insert(    trx, 'poweruser', 'tree.move', true);
    await insert(    trx, 'guest',     'tree.getDefault', false);
    await insert(    trx, 'poweruser', 'tree.getDefault', true);
    await insert(    trx, 'guest',     'tree.updateDefault', false);
    await insert(    trx, 'poweruser', 'tree.updateDefault', true);
    await insert(    trx, 'guest',     'tree.deleteDefault', false);
    await insert(    trx, 'poweruser', 'tree.deleteDefault', true);
    await insert(    trx, 'guest',     'tree.permission_read', false);
    await insert(    trx, 'admin',     'tree.permission_read', true);
    await insert(    trx, 'guest',     'tree.permission_change', false);
    await insert(    trx, 'admin',     'tree.permission_change', true);
    await insert(    trx, 'guest',     'thread.list', true);
    await insert(    trx, 'user',      'thread.list', true);
    await insert(    trx, 'moderator', 'thread.list', true);
    await insertSelf(trx,              'thread.list', true);
    await insertSGrp(trx,              'thread.list', true);
    await insert(    trx, 'guest',     'thread.get', true);
    await insert(    trx, 'user',      'thread.get', true);
    await insert(    trx, 'moderator', 'thread.get', true);
    await insertSelf(trx,              'thread.get', true);
    await insertSGrp(trx,              'thread.get', true);
    await insert(    trx, 'guest',     'thread.getwithstatus_visible', false);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'thread.getwithstatus_visible', true);
    await insertSelf(trx,              'thread.getwithstatus_visible', true);
    await insert(    trx, 'guest',     'thread.getwithstatus_enable', false);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'thread.getwithstatus_enable', true);
    await insertSelf(trx,              'thread.getwithstatus_enable', true);
    await insert(    trx, 'guest',     'thread.getwithstatus_lock', false);
    await insert(    trx, 'poweruser', 'thread.getwithstatus_lock', true);
    await insertSelf(trx,              'thread.getwithstatus_lock', true);
    await insert(    trx, 'guest',     'thread.create', false);
    await insert(    trx, 'user',      'thread.create', true);
    await insert(    trx, 'guest',     'thread.update_title', false);
    await insert(    trx, 'admin',     'thread.update_title', true);
    await insertSelf(trx,              'thread.update_title', true);
    await insert(    trx, 'guest',     'thread.update_description', false);
    await insert(    trx, 'admin',     'thread.update_description', true);
    await insertSelf(trx,              'thread.update_description', true);
    await insert(    trx, 'guest',     'thread.updatestatus_visible', false);
    await insert(    trx, 'poweruser', 'thread.updatestatus_visible', true);
    await insert(    trx, 'moderator', 'thread.updatestatus_visible', true);
    await insertSelf(trx,              'thread.updatestatus_visible', true);
    await insert(    trx, 'guest',     'thread.updatestatus_enable', false);
    await insert(    trx, 'poweruser', 'thread.updatestatus_enable', true);
    await insert(    trx, 'moderator', 'thread.updatestatus_enable', true);
    await insertSelf(trx,              'thread.updatestatus_enable', true);
    await insert(    trx, 'guest',     'thread.updatestatus_lock', false);
    await insert(    trx, 'poweruser', 'thread.updatestatus_lock', true);
    await insert(    trx, 'guest',     'thread.delete', false);
    await insert(    trx, 'owner',     'thread.delete', true);
    await insert(    trx, 'guest',     'thread.move', false);
    await insert(    trx, 'poweruser', 'thread.move', true);
    await insert(    trx, 'guest',     'thread.getDefault', false);
    await insert(    trx, 'poweruser', 'thread.getDefault', true);
    await insert(    trx, 'guest',     'thread.updateDefault', false);
    await insert(    trx, 'poweruser', 'thread.updateDefault', true);
    await insert(    trx, 'guest',     'thread.deleteDefault', false);
    await insert(    trx, 'poweruser', 'thread.deleteDefault', true);
    await insert(    trx, 'guest',     'thread.permission_read', false);
    await insert(    trx, 'admin',     'thread.permission_read', true);
    await insert(    trx, 'guest',     'thread.permission_change', false);
    await insert(    trx, 'admin',     'thread.permission_change', true);
    await insert(    trx, 'guest',     'content.list', true);
    await insert(    trx, 'user',      'content.list', true);
    await insertSelf(trx,              'content.list', true);
    await insertSGrp(trx,              'content.list', true);
    await insert(    trx, 'guest',     'content.get', true);
    await insert(    trx, 'user',      'content.get', true);
    await insertSelf(trx,              'content.get', true);
    await insertSGrp(trx,              'content.get', true);
    await insert(    trx, 'guest',     'content.getwithstatus_visible', false);
    await insert(    trx, 'poweruser', 'content.getwithstatus_visible', true);
    await insert(    trx, 'moderator', 'content.getwithstatus_visible', true);
    await insertSelf(trx,              'content.getwithstatus_visible', true);
    await insert(    trx, 'guest',     'content.getwithstatus_enable', false);
    await insert(    trx, 'poweruser', 'content.getwithstatus_enable', true);
    await insert(    trx, 'moderator', 'content.getwithstatus_enable', true);
    await insertSelf(trx,              'content.getwithstatus_enable', true);
    await insert(    trx, 'guest',     'content.getwithstatus_lock', false);
    await insert(    trx, 'poweruser', 'content.getwithstatus_lock', true);
    await insertSelf(trx,              'content.getwithstatus_lock', true);
    await insert(    trx, 'guest',     'content.create', false);
    await insert(    trx, 'user',      'content.create', true);
    await insert(    trx, 'guest',     'content.update_title', false);
    await insert(    trx, 'admin',     'content.update_title', true);
    await insertSelf(trx,              'content.update_title', true);
    await insert(    trx, 'guest',     'content.update_description', false);
    await insert(    trx, 'admin',     'content.update_description', true);
    await insertSelf(trx,              'content.update_description', true);
    await insert(    trx, 'guest',     'content.updatestatus_visible', false);
    await insert(    trx, 'poweruser', 'content.updatestatus_visible', true);
    await insert(    trx, 'moderator', 'content.updatestatus_visible', true);
    await insertSelf(trx,              'content.updatestatus_visible', true);
    await insert(    trx, 'guest',     'content.updatestatus_enable', false);
    await insert(    trx, 'poweruser', 'content.updatestatus_enable', true);
    await insert(    trx, 'moderator', 'content.updatestatus_enable', true);
    await insertSelf(trx,              'content.updatestatus_enable', true);
    await insert(    trx, 'guest',     'content.updatestatus_lock', false);
    await insert(    trx, 'poweruser', 'content.updatestatus_lock', true);
    await insert(    trx, 'guest',     'content.delete', false);
    await insert(    trx, 'owner',     'content.delete', true);
    await insert(    trx, 'guest',     'content.move', false);
    await insert(    trx, 'poweruser', 'content.move', true);
    await insert(    trx, 'guest',     'content.getDefault', false);
    await insert(    trx, 'poweruser', 'content.getDefault', true);
    await insert(    trx, 'guest',     'content.updateDefault', false);
    await insert(    trx, 'poweruser', 'content.updateDefault', true);
    await insert(    trx, 'guest',     'content.deleteDefault', false);
    await insert(    trx, 'poweruser', 'content.deleteDefault', true);
    await insert(    trx, 'guest',     'content.permission_read', false);
    await insert(    trx, 'admin',     'content.permission_read', true);
    await insert(    trx, 'guest',     'content.permission_change', false);
    await insert(    trx, 'admin',     'content.permission_change', true);
    await insert(    trx, 'guest',     'tree.getsortkey', false);
    await insert(    trx, 'poweruser', 'tree.getsortkey', true);
    await insertSelf(trx,              'tree.getsortkey', true);
    await insertSGrp(trx,              'tree.getsortkey', true);
    await insert(    trx, 'guest',     'tree.setsortkey', false);
    await insert(    trx, 'poweruser', 'tree.setsortkey', true);
    await insert(    trx, 'guest',     'tree.setsortkey_range', false);
    await insert(    trx, 'poweruser', 'tree.setsortkey_range', true);
    await insert(    trx, 'guest',     'thread.getsortkey', false);
    await insert(    trx, 'poweruser', 'thread.getsortkey', true);
    await insertSelf(trx,              'thread.getsortkey', true);
    await insertSGrp(trx,              'thread.getsortkey', true);
    await insert(    trx, 'guest',     'thread.setsortkey', false);
    await insert(    trx, 'poweruser', 'thread.setsortkey', true);
    await insert(    trx, 'guest',     'thread.setsortkey_range', false);
    await insert(    trx, 'poweruser', 'thread.setsortkey_range', true);
    await insert(    trx, 'guest',     'thread.tag_list', true);
    await insert(    trx, 'user',      'thread.tag_list', true);
    await insert(    trx, 'moderator', 'thread.tag_list', true);
    await insertSelf(trx,              'thread.tag_list', true);
    await insertSGrp(trx,              'thread.tag_list', true);
    await insert(    trx, 'guest',     'thread.tag_get', true);
    await insert(    trx, 'user',      'thread.tag_get', true);
    await insert(    trx, 'moderator', 'thread.tag_get', true);
    await insertSelf(trx,              'thread.tag_get', true);
    await insertSGrp(trx,              'thread.tag_get', true);
    await insert(    trx, 'guest',     'thread.tag_create', false);
    await insert(    trx, 'user',      'thread.tag_create', true);
    await insert(    trx, 'guest',     'thread.tag_update', false);
    await insert(    trx, 'poweruser', 'thread.tag_update', true);
    await insert(    trx, 'guest',     'thread.tag_delete', false);
    await insert(    trx, 'owner',     'thread.tag_delete', true);
    await insert(    trx, 'guest',     'content.update_contents', false);
    await insert(    trx, 'admin',     'content.update_contents', true);
    await insertSelf(trx,              'content.update_contents', true);
    await insert(    trx, 'guest',     'content.viewlogs', false);
    await insert(    trx, 'admin',     'content.viewlogs', true);
    await insert(    trx, 'moderator', 'content.viewlogs', true);
    await insert(    trx, 'guest',     'user.list', false);
    await insert(    trx, 'poweruser', 'user.list', true);
    await insert(    trx, 'guest',     'user.get', true);
    await insert(    trx, 'user',      'user.get', true);
    await insert(    trx, 'moderator', 'user.get', true);
    await insert(    trx, 'guest',     'user.getwithstatus_visible', false);
    await insert(    trx, 'admin',     'user.getwithstatus_visible', true);
    await insert(    trx, 'guest',     'user.getwithstatus_enable', false);
    await insert(    trx, 'admin',     'user.getwithstatus_enable', true);
    await insert(    trx, 'guest',     'user.getwithstatus_lock', false);
    await insert(    trx, 'admin',     'user.getwithstatus_lock', true);
    await insert(    trx, 'guest',     'user.getDetails', false);
    await insert(    trx, 'poweruser', 'user.getDetails', true);
    await insert(    trx, 'moderator', 'user.getDetails', true);
    await insertSelf(trx,              'user.getDetails', true);
    await insert(    trx, 'guest',     'user.getSensitive', false);
    await insert(    trx, 'admin',     'user.getSensitive', true);
    await insertSelf(trx,              'user.getSensitive', true);
    await insert(    trx, 'guest',     'user.create', false);
    await insert(    trx, 'admin',     'user.create', true);
    await insert(    trx, 'guest',     'user.update_name', false);
    await insert(    trx, 'admin',     'user.update_name', true);
    await insertSelf(trx,              'user.update_name', true);
    await insert(    trx, 'guest',     'user.update_description', false);
    await insert(    trx, 'admin',     'user.update_description', true);
    await insertSelf(trx,              'user.update_description', true);
    await insert(    trx, 'guest',     'user.updatestatus_visible', false);
    await insert(    trx, 'admin',     'user.updatestatus_visible', true);
    await insert(    trx, 'guest',     'user.updatestatus_enable', false);
    await insert(    trx, 'admin',     'user.updatestatus_enable', true);
    await insert(    trx, 'guest',     'user.updatestatus_lock', false);
    await insert(    trx, 'admin',     'user.updatestatus_lock', true);
    await insert(    trx, 'guest',     'user.permission_read', false);
    await insert(    trx, 'admin',     'user.permission_read', true);
    await insert(    trx, 'guest',     'user.permission_change', false);
    await insert(    trx, 'admin',     'user.permission_change', true);
    await insert(    trx, 'guest',     'group.list', false);
    await insert(    trx, 'poweruser', 'group.list', true);
    await insert(    trx, 'guest',     'group.get', true);
    await insert(    trx, 'user',      'group.get', true);
    await insert(    trx, 'moderator', 'group.get', true);
    await insertSelf(trx,              'group.get', true);
    await insertSGrp(trx,              'group.get', true);
    await insert(    trx, 'guest',     'group.getwithstatus_visible', false);
    await insert(    trx, 'admin',     'group.getwithstatus_visible', true);
    await insert(    trx, 'guest',     'group.getwithstatus_enable', false);
    await insert(    trx, 'admin',     'group.getwithstatus_enable', true);
    await insert(    trx, 'guest',     'group.getwithstatus_lock', false);
    await insert(    trx, 'admin',     'group.getwithstatus_lock', true);
    await insert(    trx, 'guest',     'group.getDetails', false);
    await insert(    trx, 'poweruser', 'group.getDetails', true);
    await insert(    trx, 'moderator', 'group.getDetails', true);
    await insertSelf(trx,              'group.getDetails', true);
    await insertSGrp(trx,              'group.getDetails', true);
    await insert(    trx, 'guest',     'group.getSensitive', false);
    await insert(    trx, 'admin',     'group.getSensitive', true);
    await insert(    trx, 'guest',     'group.create', false);
    await insert(    trx, 'admin',     'group.create', true);
    await insert(    trx, 'guest',     'group.update_name', false);
    await insert(    trx, 'admin',     'group.update_name', true);
    await insert(    trx, 'guest',     'group.update_description', false);
    await insert(    trx, 'admin',     'group.update_description', true);
    await insert(    trx, 'guest',     'group.updatestatus_visible', false);
    await insert(    trx, 'admin',     'group.updatestatus_visible', true);
    await insert(    trx, 'guest',     'group.updatestatus_enable', false);
    await insert(    trx, 'admin',     'group.updatestatus_enable', true);
    await insert(    trx, 'guest',     'group.updatestatus_lock', false);
    await insert(    trx, 'admin',     'group.updatestatus_lock', true);
    await insert(    trx, 'guest',     'group.permission_read', false);
    await insert(    trx, 'admin',     'group.permission_read', true);
    await insert(    trx, 'guest',     'group.permission_change', false);
    await insert(    trx, 'admin',     'group.permission_change', true);
    await insert(    trx, 'guest',     'user.setpassword', false);
    await insert(    trx, 'owner',     'user.setpassword', true);
    await insertSelf(trx,              'user.setpassword', true);
    await insert(    trx, 'guest',     'user.force_setpassword', false);
    await insert(    trx, 'owner',     'user.force_setpassword', true);
    await insert(    trx, 'guest',     'user.setemail', false);
    await insert(    trx, 'owner',     'user.setemail', true);
    await insertSelf(trx,              'user.setemail', true);
    await insert(    trx, 'guest',     'group.adduser', false);
    await insert(    trx, 'admin',     'group.adduser', true);
    await insert(    trx, 'guest',     'group.removeuser', false);
    await insert(    trx, 'admin',     'group.removeuser', true);
    await insert(    trx, 'guest',     'group.addgroup', false);
    await insert(    trx, 'admin',     'group.addgroup', true);
    await insert(    trx, 'guest',     'group.removegroup', false);
    await insert(    trx, 'admin',     'group.removegroup', true);
    await insert(    trx, 'guest',     'change_permission.permission_inheritance', false);
    await insert(    trx, 'owner',     'change_permission.permission_inheritance', true);
    await insert(    trx, 'guest',     'change_permission.user_permission_template', false);
    await insert(    trx, 'owner',     'change_permission.user_permission_template', true);
    await insert(    trx, 'guest',     'change_permission.group_permission_template', false);
    await insert(    trx, 'owner',     'change_permission.group_permission_template', true);
    await insert(    trx, 'guest',     'change_permission.user_self_permission', false);
    await insert(    trx, 'owner',     'change_permission.user_self_permission', true);
    await insert(    trx, 'guest',     'change_permission.group_self_permission', false);
    await insert(    trx, 'owner',     'change_permission.group_self_permission', true);
    await insert(    trx, 'guest',     'change_permission.tier_self_permission', false);
    await insert(    trx, 'owner',     'change_permission.tier_self_permission', true);
    await insert(    trx, 'guest',     'tier.create', false);
    await insert(    trx, 'owner',     'tier.create', true);
    await insert(    trx, 'guest',     'tier.delete', false);
    await insert(    trx, 'owner',     'tier.delete', true);
    await insert(    trx, 'guest',     'tier.change_name', false);
    await insert(    trx, 'owner',     'tier.change_name', true);
    await insert(    trx, 'guest',     'tier.user_add', false);
    await insert(    trx, 'owner',     'tier.user_add', true);
    await insert(    trx, 'guest',     'tier.user_remove', false);
    await insert(    trx, 'owner',     'tier.user_remove', true);
    await insert(    trx, 'guest',     'tier.group_add', false);
    await insert(    trx, 'owner',     'tier.group_add', true);
    await insert(    trx, 'guest',     'tier.group_remove', false);
    await insert(    trx, 'owner',     'tier.group_remove', true);
  });
}
