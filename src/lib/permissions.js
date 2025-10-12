import cache from "../cache.js";
import utils from "./utils.js";
import cacheUser from './cacheUser.js';

function retAllowed(val) {
  if (val === true) return true;
  if (val === false) return false;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return false;
}

export default {
  UNIT_USER : 1,
  UNIT_GROUP : 2,
  UNIT_TIER : 3,
  UNIT_ALL : 4,

  SOURCE_USER : 1,
  SOURCE_GROUP : 2,
  SOURCE_USER_TEMPLATE : 3,
  SOURCE_GROUP_TEMPLATE : 4,
  SOURCE_TIER_TEMPLATE : 5,
  SOURCE_DIRECT : 6,

  TARGET_TREE : 1,
  TARGET_THREAD : 2,
  TARGET_CONTENTS : 3,
  TARGET_USER : 4,
  TARGET_GROUP : 5,
  TARGET_TIER : 6,
  TARGET_PERMISSION : 7,

  usermapping: async function(current_userid, userid, target, target_id, trx) {
    const user = await cacheUser.getUserById(userid, trx);
    if (!user) return null;
    if (!this.isAllowed(trx, current_userid, 'user.get', target, target_id)) return {};
    const ret = {
      id: user.id,
      // login_id: user.login_id,
      display_name: user.display_name,
      //email: user.email,
      //description: user.description,
      created_at: user.created_at,
      created_at_str: settings.datetool.format(new Date(user.created_at)),
    };
    if (this.isAllowed(trx, current_userid, 'user.get_sensitive', target, target_id)) {
      ret.login_id = user.login_id;
    }
    if (this.isAllowed(trx, current_userid, 'user.getDetails', target, target_id)){
      ret.email = user.email;
      ret.description = user.description;
      ret.activated = user.activated;
      ret.verified_email = user.verified_email;
      ret.updated_at = user.updated_at;
      ret.updated_at_str = settings.datetool.format(new Date(user.updated_at));
    }
    if (this.isAllowed(trx, current_userid, 'user.getwithstatus_visible', target, target_id)){
      ret.visibled = user.visibled;
    }
    if (this.isAllowed(trx, current_userid, 'user.getwithstatus_enable', target, target_id)){
      ret.enabled = user.enabled;
    }
    if (this.isAllowed(trx, current_userid, 'user.getwithstatus_lock', target, target_id)){
      ret.locked = user.locked;
    }
    return ret;
  },
  groupmapping: async function(current_userid, groupid, target, target_id, trx) {
    const group = await trx('groups').select('*').where({ id: groupid }).first();
    if (!group) return null;
    if (!this.isAllowed(trx, current_userid, 'group.get', target, target_id)) return {};
    const ret = {
      id: group.id,
      name: group.name,
      created_at: group.created_at,
      created_at_str: settings.datetool.format(new Date(group.created_at)),
    };
    if (this.isAllowed(trx, current_userid, 'group.getDetails', target, target_id)){
      ret.description = group.description;
      ret.updated_at = group.updated_at;
      ret.updated_at_str = settings.datetool.format(new Date(group.updated_at));
    }
    if (this.isAllowed(trx, current_userid, 'group.getwithstatus_visible', target, target_id)){
      ret.visibled = group.visibled;
    }
    if (this.isAllowed(trx, current_userid, 'group.getwithstatus_enable', target, target_id)){
      ret.enabled = group.enabled;
    }
    if (this.isAllowed(trx, current_userid, 'group.getwithstatus_lock', target, target_id)){
      ret.locked = group.locked;
    }
    if (this.isAllowed(trx, current_userid, 'group.getSensitive', target, target_id)) {
      // get users
      const rows = await trx('map_usergroup').select('user_id').where({ group_id: group.id });
      ret.user_count = rows.length;
      ret.users = [];
      for (const row of rows) {
        const u = await this.usermapping(current_userid, row.user_id, target, target_id, trx);
        if (u) ret.users.push(u);
      }
    }
    return ret;
  },

  isAllowedSelf: async function(trx, userid, actionid,selfObject) {
    let allowed = null;
    // check user_self_permission
    if (allowed === null && selfObject.userid === userid){
      const row = await trx('user_self_permission').select('is_allow').where({ action: actionid }).first();
      if (row) {
        allowed = row.is_allow;
      }
    }
    // check group_self_permission
    if (allowed === null && selfObject.groupids && selfObject.groupids.length > 0) {
      // get groups for user
      let group_ids = await cache.hget(`permissions:usergroups:${userid}`, 'group_ids');
      if (group_ids === null) {
        // not in cache, check db
        const rows = await trx('map_usergroup').select('group_id').where({ user_id: userid });
        group_ids = rows.map(r => r.group_id);
        await cache.hset(`permissions:usergroups:${userid}`, 'group_ids', JSON.stringify(group_ids));
      }else{
        group_ids = JSON.parse(group_ids);
      }
      let inGroup = false;
      for(const gid of group_ids){
        if (selfObject.groupids.indexOf(gid) >= 0) {
          inGroup = true;
          break;
        }
      }
      if (inGroup){
        const rows = await trx('group_self_permission').select('is_allow').whereIn('action', actionid);
        if (rows.length > 0) {
          // take the first one
          allowed = rows[0].is_allow;
        }
      }
    }
    // check tier_self_permission
    if (allowed === null && selfObject.tierids && selfObject.tierids.length > 0) {
      // get tiers for user + groups
      let tier_ids = await cache.hget(`permissions:usertiers:${userid}`, 'tier_ids');
      if (tier_ids === null) {
        // not in cache, check db
        const rows = await trx('map_usertier').select('tier_id').where({ user_id: userid });
        tier_ids = rows.map(r => r.tier_id);
        await cache.hset(`permissions:usertiers:${userid}`, 'tier_ids', JSON.stringify(tier_ids));
      }else{
        tier_ids = JSON.parse(tier_ids);
      }
      // get groups for user
      let group_ids = await cache.hget(`permissions:usergroups:${userid}`, 'group_ids');
      if (group_ids === null) {
        // not in cache, check db
        const rows = await trx('map_usergroup').select('group_id').where({ user_id: userid });
        group_ids = rows.map(r => r.group_id);
        await cache.hset(`permissions:usergroups:${userid}`, 'group_ids', JSON.stringify(group_ids));
      }else{
        group_ids = JSON.parse(group_ids);
      }
      let group_tier_ids = await cache.hget(`permissions:usertiers:${userid}`, 'group_tier_ids');
      if (group_tier_ids === null){
        group_tier_ids = [];
        // not in cache, check db
        for (const group_id of group_ids) {
          const rows = await trx('map_grouptier').select('tier_id').where({ group_id });
          const ids = rows.map(r => r.tier_id);
          group_tier_ids.push(...ids);
        }
        await cache.hset(`permissions:usertiers:${userid}`, 'group_tier_ids', JSON.stringify(group_tier_ids));
      } else {
        group_tier_ids = JSON.parse(group_tier_ids);
      }
      let inTier = false;
      for(const tid of tier_ids){
        if (selfObject.tierids.indexOf(tid) >= 0) {
          inTier = true;
          break;
        }
      }
      if (!inTier && group_tier_ids && group_tier_ids.length > 0) {
        for (const gid of group_tier_ids) {
          if (selfObject.tierids.indexOf(gid) >= 0) {
            inTier = true;
            break;
          }
        }
      }
      if (inTier){
        const rows = await trx('tier_self_permission').select('is_allow').whereIn('action', actionid);
        if (rows.length > 0) {
          // take the first one
          allowed = rows[0].is_allow;
        }
      }
    }
    return allowed; // can be true, false, null
  },

  isAllowed: async function(trx, userid, permission_id, target, target_id, selfObject) {
    const pkey = `permissions:isAllowed:${target}:${target_id}`;
    const skey = `${userid}:${permission_id}`;
    return await cache.run(async () => {
      let allowed = await cache.hget(pkey, skey);
      if (allowed === null) {
        // not in cache, check db
        let actionid = await cache.hget(`permissions:actionid`, permission_id);
        if (actionid === null) {
          const row = await trx('permissions').select('id').where({ permission_id: permission_id }).first();
          if (!row) {
            // no such action, so no permissions
            await cache.hset(pkey, skey, 'false');
            return retAllowed(false);
          }
          actionid = row.id;
          await cache.hset(`permissions:actionid`, permission_id, actionid.toString());
        } else {
          actionid = utils.parseSafeInt(actionid);
        }
        // check resources
        let inheritance_id = await cache.hget(`permissions:resources:${target}:${target_id}`, 'inheritance_id');
        if (inheritance_id === null) {
          // not in cache, check db
          const res = await trx('resources').select('inheritance_id').where({ target, target_id }).first();
          if (!res) {
            // no resource, self permission only
            allowed = await this.isAllowedSelf(trx, userid, actionid,selfObject);
            if (allowed === null) allowed = false;
            await cache.hset(pkey, skey, allowed.toString());
            return retAllowed(allowed);
          }
          inheritance_id = res.inheritance_id;
          await cache.hset(`permissions:resources:${target}:${target_id}`, 'inheritance_id', inheritance_id.toString());
        }else{
          inheritance_id = utils.parseSafeInt(inheritance_id);
        }
        // get groups for user
        let group_ids = await cache.hget(`permissions:usergroups:${userid}`, 'group_ids');
        if (group_ids === null) {
          // not in cache, check db
          const rows = await trx('map_usergroup').select('group_id').where({ user_id: userid });
          group_ids = rows.map(r => r.group_id);
          await cache.hset(`permissions:usergroups:${userid}`, 'group_ids', JSON.stringify(group_ids));
        }else{
          group_ids = JSON.parse(group_ids);
        }
        // get tier for user
        let tier_ids = await cache.hget(`permissions:usertiers:${userid}`, 'tier_ids');
        if (tier_ids === null) {
          // not in cache, check db
          const rows = await trx('map_usertier').select('tier_id').where({ user_id: userid });
          tier_ids = rows.map(r => r.tier_id);
          await cache.hset(`permissions:usertiers:${userid}`, 'tier_ids', JSON.stringify(tier_ids));
        }else{
          tier_ids = JSON.parse(tier_ids);
        }
        // get tier for groups
        let group_tier_ids = await cache.hget(`permissions:usertiers:${userid}`, 'group_tier_ids');
        if (group_tier_ids === null){
          for (const group_id of group_ids) {
            let tgids = await cache.hget(`permissions:groptiers:${group_id}`, 'tier_ids');
            if (tgids === null) {
              // not in cache, check db
              const rows = await trx('map_grouptier').select('tier_id').where({ group_id });
              tgids = rows.map(r => r.tier_id);
              await cache.hset(`permissions:groptiers:${group_id}`, 'tier_ids', JSON.stringify(tgids));
            }else{
              tgids = JSON.parse(tgids);
            }
            group_tier_ids = group_tier_ids.concat(tgids);
          }
          await cache.hset(`permissions:usertiers:${userid}`, 'group_tier_ids', JSON.stringify(group_tier_ids));
        } else {
          group_tier_ids = JSON.parse(group_tier_ids);
        }
        // now we have inheritance_id, user_id, group_ids, tier_ids, group_tier_ids
        // check access_rules
        allowed = null;
        let current_inheritance_id = inheritance_id;
        while(allowed === null && current_inheritance_id > 0) {
          const rows = await trx.select('is_allow')
            .from('access_rules')
            .where('inheritance_id', current_inheritance_id)
            .andWhere('action', actionid)
            .andWhere(function() {
              this.where(function() {
                this.where('unit', this.UNIT_USER).andWhere('unit_id', userid);
              }).orWhere(function() {
                if (group_ids.length > 0) {
                  this.where('unit', this.UNIT_GROUP).andWhereIn('unit_id', group_ids);
                }
              }).orWhere(function() {
                if (tier_ids.length > 0) {
                  this.where('unit', this.UNIT_TIER).andWhereIn('unit_id', tier_ids);
                }
              }).orWhere(function() {
                if (group_tier_ids.length > 0) {
                  this.where('unit', this.UNIT_TIER).andWhereIn('unit_id', group_tier_ids);
                }
              }).orWhere(function() {
                this.where('unit', this.UNIT_ALL);
              });
            }.bind(this))
            .orderBy('orderno', 'asc')
            .limit(1);
          if (rows.length === 0) {
            const res = await trx('inheritance').select('parent_id').where({ id: current_inheritance_id }).first();
            if (!res) {
              current_inheritance_id = -1;
            } else {
              current_inheritance_id = res.parent_id;
            }
          } else {
            allowed = rows[0].is_allow;
          }
        }
        if (allowed === null) {
          // self permission only
          allowed = await this.isAllowedSelf(trx, userid, actionid,selfObject);
        }
        if (allowed === null) allowed = false;
        if (allowed) {
          await cache.hset(pkey, skey, allowed.toString());
        }
      }
      return retAllowed(allowed);
    });
  },

  createNewInheritance: async function(trx, parent_id, name, addTemplate, force_insert_id) {
    let id = null;
    if (force_insert_id && force_insert_id > 0) {
      const c = await trx.select('id').from('permission_inheritance').where('id',force_insert_id).first();
      if (c){
        throw new Error(`Cannot create permission_inheritance with id ${force_insert_id} because it already exists.`);
      }
      const insertRes = await trx('permission_inheritance').insert({
        id: force_insert_id,
        parent_id,
        name,
      }).returning('id');
      id = insertRes[0].id;
      if (id !== force_insert_id){
        throw new Error(`Cannot create permission_inheritance with id ${force_insert_id} because the database assigned a different id ${id}.`);
      }
    }else{
      const insertRes = await trx('permission_inheritance').insert({
        parent_id,
        name,
      }).returning('id');
      id = insertRes[0].id;
    }
    if (addTemplate === true){
      // copy template rule to access_rules
      // from user_permission_template
      for (const row of await trx('user_permission_template').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ inheritance_id: id, action: row.action }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          inheritance_id: id,
          action: row.action,
          unit: this.UNIT_USER,
          unit_id: row.user_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_USER_TEMPLATE,
          source_id: row.id,
        });
      }
      // from group_permission_template
      for (const row of await trx('group_permission_template').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ inheritance_id: id, action: row.action }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          inheritance_id: id,
          action: row.action,
          unit: this.UNIT_GROUP,
          unit_id: row.group_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_GROUP_TEMPLATE,
          source_id: row.id,
        });
      }
      // from tier_permission_template
      for (const row of await trx('tier_permission_template').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ inheritance_id: id, action: row.action }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          inheritance_id: id,
          action: row.action,
          unit: this.UNIT_TIER,
          unit_id: row.tier_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_TIER_TEMPLATE,
          source_id: row.id,
        });
      }
    }
    return id;
  },

  createResource: async function(trx, target, target_id, parent_target_id, isCreateInheritance, isCreateNewInheritance) {
    let inheritance_id = 1; // default to root
    let parent_inheritance_id = 1; // default to root
    // check if already exists
    const cres = await trx('resources').select('inheritance_id').where({ target, target_id }).first();
    if (cres) return cres.inheritance_id;
    // check parent
    if (parent_target_id && parent_target_id > 0) {
      const pres = await trx('resources').select('inheritance_id').where({ target, target_id: parent_target_id }).first();
      if (pres) {
        parent_inheritance_id = pres.inheritance_id;
        inheritance_id = parent_inheritance_id;
      }
    }
    if (isCreateInheritance === true) {
      if (isCreateNewInheritance === true) {
        // create new inheritance as new root
        inheritance_id = await this.createNewInheritance(trx, -1, `Resource for ${target}:${target_id}`, true); // copy template
      }else{
        // create new inheritance as child of parent_inheritance_id
        inheritance_id = await this.createNewInheritance(trx, parent_inheritance_id, `Resource for ${target}:${target_id}`, false); // do not copy template
      }
    }
    await trx('resources').insert({
      target,
      target_id,
      inheritance_id,
    });
    // invalidate cache
    await cache.del(`permissions:resources:${target}:${target_id}`);
    await cache.del(`permissions:isAllowed:${target}:${target_id}`);
    return inheritance_id;
  },
  deleteResource: async function(trx, target, target_id) {
    const cres = await trx('resources').select('inheritance_id').where({ target, target_id }).first();
    if (!cres) return;
    const inheritance_id = cres.inheritance_id;
    await trx('resources').where({ target, target_id }).del();
    // check if any other resources use the same inheritance_id
    const ores = await trx('resources').select('id').where({ inheritance_id }).first();
    if (!ores) {
      // no other resources use this inheritance_id, so delete it
      await trx('permission_inheritance').where({ id: inheritance_id }).del();
      // access_rules delete
      await trx('access_rules').where({ inheritance_id }).del();
    }
    // invalidate cache
    await cache.del(`permissions:resources:${target}:${target_id}`);
    await cache.del(`permissions:isAllowed:${target}:${target_id}`);
  },

  pushAccessRule: async function(trx, inheritance_id, action, unit, unit_id, is_allow, source, source_id) {
    const maxccnt = await trx('access_rules').max('orderno as maxorderno').where({ inheritance_id, action }).first();
    let orderno = 1;
    if (maxccnt && maxccnt.maxorderno) orderno = maxccnt.maxorderno + 1;
    await trx('access_rules').insert({
      inheritance_id,
      action,
      unit,
      unit_id,
      is_allow,
      orderno,
      source,
      source_id,
    });
    // disable cache for this inheritance_id
    for(const row of await trx('resources').select('target','target_id').where({ inheritance_id })){
      await cache.del(`permissions:isAllowed:${row.target}:${row.target_id}`);
    }
  },
  unshiftAccessRule: async function(trx, inheritance_id, action, unit, unit_id, is_allow, source, source_id) {
    const minccnt = await trx('access_rules').min('orderno as minorderno').where({ inheritance_id, action }).first();
    let orderno = 1;
    if (minccnt && minccnt.minorderno) orderno = minccnt.minorderno - 1;
    await trx('access_rules').insert({
      inheritance_id,
      action,
      unit,
      unit_id,
      is_allow,
      orderno,
      source,
      source_id,
    });
    // disable cache for this inheritance_id
    for(const row of await trx('resources').select('target','target_id').where({ inheritance_id })){
      await cache.del(`permissions:isAllowed:${row.target}:${row.target_id}`);
    }
  },
  deleteAccessRule: async function(trx, id) {
    await trx('access_rules').where({ id }).del();
    // disable cache for this inheritance_id
    for(const row of await trx('resources').select('target','target_id').where({ inheritance_id })){
      await cache.del(`permissions:isAllowed:${row.target}:${row.target_id}`);
    }
  },
  updateAccessRuleAllow: async function(trx, id, is_allow) {
    await trx('access_rules').where({ id }).update({ is_allow });
    // disable cache for this inheritance_id
    for(const row of await trx('resources').select('target','target_id').where({ inheritance_id })){
      await cache.del(`permissions:isAllowed:${row.target}:${row.target_id}`);
    }
  },
  getAccessRules: async function(trx, inheritance_id) {
    let rules = [];
    for (const row of await trx('access_rules').where({ inheritance_id }).orderBy(['action', { column: 'orderno', order: 'asc' }])) {
      // process each row
      rules.push({
        id: row.id,
        inheritance_id: row.inheritance_id,
        action: row.action,
        unit: row.unit,
        unit_id: row.unit_id,
        is_allow: row.is_allow,
        orderno: row.orderno,
        source: row.source,
        source_id: row.source_id,
        created_at: row.created_at,
      });
    }
    return rules;
  },
  setAccessRule: async function(trx, inheritance_id, fields) {
    trx('access_rules').where({ inheritance_id }).del();
    let orderno = 1;
    for (const row of fields) {
      if (!row.action || !row.unit || row.is_allow === undefined || row.is_allow === null) continue;
      if (row.unit === this.UNIT_ALL) row.unit_id = 0;
      if (row.unit_id === undefined || row.unit_id === null) continue;
      // insert
      await trx('access_rules').insert({
        inheritance_id,
        action: row.action,
        unit: row.unit,
        unit_id: row.unit_id,
        is_allow: row.is_allow,
        orderno: orderno,
        source: row.source || this.SOURCE_DIRECT,
        source_id: row.source_id || 0,
      });
      orderno++;
    }
    // disable cache for this inheritance_id
    for(const row of await trx('resources').select('target','target_id').where({ inheritance_id })){
      await cache.del(`permissions:isAllowed:${row.target}:${row.target_id}`);
    }
  },
  getInheritanceId: async function(trx, target, target_id) {
    const cres = await trx('resources').select('inheritance_id').where({ target, target_id }).first();
    return cres ? cres.inheritance_id : null;
  },
  getParentInheritanceId: async function(trx, inheritance_id) {
    if (inheritance_id <= 0) return null;
    const cres = await trx('permission_inheritance').select('parent_id').where({ id: inheritance_id }).first();
    return cres ? cres.parent_id : null;
  },
  getGroupIDByName: async function(trx, name) {
    const row = await trx('groups').select('id').where({ group_id: name }).first();
    return row ? row.id : null;
  },
  checkUserInGroup: async function(trx, userid, groupid) {
    const row = await trx('map_usergroup').select('id').where({ user_id: userid, group_id: groupid }).first();
    return row ? true : false;
  },
  addGroup: async function(trx, userid, groupid) {
    await trx('map_usergroup').insert({ user_id: userid, group_id: groupid });
    await cache.del(`permissions:usergroups:${userid}`);
  },
  removeGroup: async function(trx, userid, groupid) {
    await trx('map_usergroup').where({ user_id: userid, group_id: groupid }).del();
    await cache.del(`permissions:usergroups:${userid}`);
  },
  getTierIDByName: async function(trx, name) {
    const row = await trx('tiers').select('id').where({ name }).first();
    return row ? row.id : null;
  },
  checkUserInTier: async function(trx, userid, tierid) {
    const row = await trx('map_usertier').select('id').where({ user_id: userid, tier_id: tierid }).first();
    return row ? true : false;
  },
  checkGroupInTier: async function(trx, groupid, tierid) {
    const row = await trx('map_grouptier').select('id').where({ group_id: groupid, tier_id: tierid }).first();
    return row ? true : false;
  },
  addTier_User: async function(trx, userid, tierid) {
    await trx('map_usertier').insert({ user_id: userid, tier_id: tierid });
    await cache.del(`permissions:usertiers:${userid}`);
  },
  removeTier_User: async function(trx, userid, tierid) {
    await trx('map_usertier').where({ user_id: userid, tier_id: tierid }).del();
    await cache.del(`permissions:usertiers:${userid}`);
  },
  addTier_Group: async function(trx, groupid, tierid) {
    await trx('map_grouptier').insert({ group_id: groupid, tier_id: tierid });
    // invalidate all users in this group
    for(const row of await trx('map_usergroup').select('user_id').where({ group_id: groupid })){
      await cache.del(`permissions:usertiers:${row.user_id}`);
    }
  },
  removeTier_Group: async function(trx, groupid, tierid) {
    await trx('map_grouptier').where({ group_id: groupid, tier_id: tierid }).del();
    // invalidate all users in this group
    for(const row of await trx('map_usergroup').select('user_id').where({ group_id: groupid })){
      await cache.del(`permissions:usertiers:${row.user_id}`);
    }
  },
};