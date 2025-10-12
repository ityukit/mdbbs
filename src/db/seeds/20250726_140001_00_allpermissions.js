const permissions = [];


// for contents
for(const ctype of ['tree','thread','content']){
  for(const action of ['list','get',
                       'getwithstatus_visible','getwithstatus_enable','getwithstatus_lock',
                       'create',
                       'update_title','update_description',
                       'updatestatus_visible','updatestatus_enable','updatestatus_lock',
                       'delete','move',
                       'getDefault','updateDefault','deleteDefault',
                       'permission_read','permission_change']){
    permissions.push(`${ctype}.${action}`)
  }
}
for(const ctype of ['tree','thread']){
  for(const action of ['getsortkey','setsortkey','setsortkey_range']){
    permissions.push(`${ctype}.${action}`)
  }
}
for(const ctype of ['thread']){
  for(const action of ['tag_list','tag_get','tag_create','tag_update','tag_delete']){
    permissions.push(`${ctype}.${action}`)
  }
}
for(const ctype of ['content']){
  for(const action of ['update_contents','viewlogs']){
    permissions.push(`${ctype}.${action}`)
  }
}

// for usergroup
for(const utype of ['user','group']){
  for(const action of ['list','get',
                       'getwithstatus_visible','getwithstatus_enable','getwithstatus_lock',
                       'getDetails','getSensitive',
                       'create',
                       'update_name','update_description',
                       'updatestatus_visible','updatestatus_enable','updatestatus_lock',
                       'permission_read','permission_change']){
    permissions.push(`${utype}.${action}`)
  }
}
for(const utype of ['user']){
  for(const action of ['setpassword','force_setpassword','setemail']){
    permissions.push(`${utype}.${action}`)
  }
}
for(const utype of ['group']){
  for(const action of ['adduser','removeuser','addgroup','removegroup']){
    permissions.push(`${utype}.${action}`)
  }
}
for(const ptype of ['change_permission']){
  for(const target of ['permission_inheritance','user_permission_template','group_permission_template','user_self_permission','group_self_permission','tier_self_permission']){
    permissions.push(`${ptype}.${target}`)
  }
}
for(const ttype of ['tier']){
  for(const action of ['create','delete','change_name','user_add','user_remove','group_add','group_remove']){
    permissions.push(`${ttype}.${action}`)
  }
}

export default permissions;
