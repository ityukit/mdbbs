import cache from "../cache.js";
import utils from "./utils.js";
import cacheUser from './cacheUser.js';
import { is } from "date-fns/locale";
import f from "session-file-store";

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
  SOURCE_USER_RULES : 3,
  SOURCE_GROUP_RULES : 4,
  SOURCE_TIER_RULES : 5,
  SOURCE_DIRECT : 6,

  TARGET_TREE : 1,
  TARGET_THREAD : 2,
  TARGET_CONTENTS : 3,
  TARGET_USER : 4,
  TARGET_GROUP : 5,
  TARGET_TIER : 6,
  TARGET_RULES : 7,

  usermapping: async function(current_userid, userid, target, target_id, trx) {
    const user = await cacheUser.getUserById(userid, trx);
    if (!user) return null;
    const multipleAllowed = this.isMultipleAllowed(trx, current_userid, ['user.get', 'user.get_sensitive','user.getDetails','user.getwithstatus_visible','user.getwithstatus_enable','user.getwithstatus_lock'], target, target_id);
    if (!multipleAllowed['user.get']) return {};
    const ret = {
      id: user.id,
      // login_id: user.login_id,
      display_name: user.display_name,
      //email: user.email,
      //description: user.description,
      created_at: user.created_at,
      created_at_str: settings.datetool.format(new Date(user.created_at)),
    };
    if (multipleAllowed['user.get_sensitive']) {
      ret.login_id = user.login_id;
    }
    if (multipleAllowed['user.getDetails']){
      ret.email = user.email;
      ret.description = user.description;
      ret.activated = user.activated;
      ret.verified_email = user.verified_email;
      ret.updated_at = user.updated_at;
      ret.updated_at_str = settings.datetool.format(new Date(user.updated_at));
    }
    if (multipleAllowed['user.getwithstatus_visible']){
      ret.visibled = user.visibled;
    }
    if (multipleAllowed['user.getwithstatus_enable']){
      ret.enabled = user.enabled;
    }
    if (multipleAllowed['user.getwithstatus_lock']){
      ret.locked = user.locked;
    }
    return ret;
  },
  groupmapping: async function(current_userid, groupid, target, target_id, trx) {
    const group = await cacheUser.getGroupById(groupid, trx);
    if (!group) return null;
    const multipleAllowed = this.isMultipleAllowed(trx, current_userid, ['group.get', 'group.getSensitive','group.getDetails','group.getwithstatus_visible','group.getwithstatus_enable','group.getwithstatus_lock'], target, target_id);
    if (!multipleAllowed['group.get']) return {};
    const ret = {
      id: group.id,
      name: group.name,
      created_at: group.created_at,
      created_at_str: settings.datetool.format(new Date(group.created_at)),
    };
    if (multipleAllowed['group.getDetails']){
      ret.description = group.description;
      ret.updated_at = group.updated_at;
      ret.updated_at_str = settings.datetool.format(new Date(group.updated_at));
    }
    if (multipleAllowed['group.getwithstatus_visible']){
      ret.visibled = group.visibled;
    }
    if (multipleAllowed['group.getwithstatus_enable']){
      ret.enabled = group.enabled;
    }
    if (multipleAllowed['group.getwithstatus_lock']){
      ret.locked = group.locked;
    }
    if (multipleAllowed['group.getSensitive']) {
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

  isAllowedSelf: async function(trx, userid, actionid, context_ids, selfObject) {
    let allowed = null;
    // check user_self_rules
    if (await this.isUserEnabled(trx, userid) === false) {
      return false;
    }
    if (allowed === null && selfObject.userids.indexOf(userid) >= 0){
      const row = await trx('user_self_rules').select('is_allow').where({ action_id: actionid }).first();
      if (row) {
        allowed = row.is_allow;
      }
  }
    // check group_self_permission
    if (allowed === null && selfObject.groupids && selfObject.groupids.length > 0) {
      // get groups for user
      let group_ids = await this.getFullEnabledGroupIdsByUser(trx, userid, context_ids); // ensure cache
      let inGroup = false;
      for(const gid of group_ids){
        if (await this.isGroupEnabled(trx, gid) === true) {
          if (selfObject.groupids.indexOf(gid) >= 0) {
            inGroup = true;
            break;
          }
        }
      }
      if (inGroup){
        const row = await trx('group_self_rules').select('is_allow').whereIn('action_id', actionid).first();
        if (row) {
          allowed = row.is_allow;
        }
      }
    }
    // check tier_self_permission
    if (allowed === null && selfObject.tierids && selfObject.tierids.length > 0) {
      // get tiers for user + groups
      let tier_ids = await this.getTierIdsByUser(trx, userid, context_ids); // ensure cache
      let inTier = false;
      for(const tid of tier_ids){
        if (await this.isTierEnabled(trx, tid) === true) {
          if (selfObject.tierids.indexOf(tid) >= 0) {
            inTier = true;
            break;
          }
        }
      }
      if (inTier){
        const row = await trx('tier_self_rules').select('is_allow').whereIn('action_id', actionid).first();
        if (row) {
          allowed = row.is_allow;
        }
      }
    }
    return allowed; // can be true, false, null
  },

  isAllowed: async function(trx, userid, action_name, target, target_id, selfObject) {
    return (await this.isMultipleAllowed(trx, userid, [action_name], target, target_id, selfObject))[action_name];
  },

  isMultipleAllowed: async function(trx, userid, action_names, target, target_id, selfObject) {
    const pkey = `rules:isAllowed:${target}:${target_id}:${userid}`;
    const skey = `${action_names.sort().join(',')}`;
    let allowed = await cache.hget(pkey, skey);
    const result = {};
    if (await this.isUserEnabled(trx, userid) === false) {
      const t = {};
      for (const action_name of action_names) {
        t[action_name] = false;
      }
      allowed = JSON.stringify(t);
    }
    if (allowed === undefined || allowed === null) {
      // check resources
      const resource_id = await this.getResourceIdByTarget(trx, target, target_id);
      // get context_ids
      const context_ids = await this.getContextIdsByResourceId(trx, resource_id);
      // get groups for user
      const group_ids = await this.getFullEnabledGroupIdsByUser(trx, userid); // ensure cache
      // get tier for user
      let tier_ids = {};
      for(const cid of context_ids){
        const tids = await this.getTierIdsByUserOnlyOneContext(trx, userid, cid); // ensure cache
        for(const tid of tids){
          if (tid < 0) {
            // 明確に拒否する
            await cache.hset(pkey, skey, 'false');
            return retAllowed(false);
          }
          if (await this.isTierEnabled(trx, tid) === true){
            tier_ids[cid] = tid;
          }
        }
      }
      //let tier_ids = await this.getTierIdsByUser(trx, userid, context_ids); // ensure cache
      // now we have inheritance_id, user_id, group_ids, tier_ids, group_tier_ids
      // check each action_name
      const actionids = {};
      for (const action_name of action_names) {
        const sskey = `${action_name}`;
        let allowed = await cache.hget(pkey, sskey);
        if (allowed !== undefined && allowed !== null) {
          result[action_name] = retAllowed(allowed);
        }else{
          let actionid = await cache.hget(`rules:actionid`, action_name);
          if (actionid === undefined || actionid === null) {
            const row = await trx('actions').select('id').where({ action_name: action_name }).first();
            if (!row) {
              // no such action, so no permissions
              allowed = false;
              result[action_name] = false;
              continue;
            }
            actionid = row.id;
            await cache.hset(`rules:actionid`, action_name, actionid.toString());
          } else {
            actionid = utils.parseSafeInt(actionid);
          }
          actionids[action_name] = actionid;
          // check access_rules
          allowed = null;
          let current_context_ids = [];
          for(const cid of context_ids){
            if (await this.isContextEnabled(trx, cid) === true){
              current_context_ids.push(cid);
            }
          }
          while(allowed === null && (current_context_ids !== null && current_context_ids.length > 0)) {
            let found = null;
            for (const cid of current_context_ids) {
              const rows = await trx.select('is_allow')
                                    .from('access_rules')
                                    .where({ action_id: actionid, context_id: cid })
                                    .andWhere(function() {
                                      this.where('unit', this.UNIT_USER).andWhere('unit_id', userid);
                                      if (group_ids.length > 0) {
                                        this.orWhere(function() {
                                          this.where('unit', this.UNIT_GROUP).andWhereIn('unit_id', group_ids);
                                        }.bind(this));
                                      }
                                      if (tier_ids[cid] && tier_ids[cid].length > 0) {
                                        this.orWhere(function() {
                                          this.where('unit', this.UNIT_TIER).andWhereIn('unit_id', tier_ids[cid]);
                                        }.bind(this));
                                      }
                                      this.orWhere(function() {
                                        this.where('unit', this.UNIT_ALL);
                                      }.bind(this));
                                    }.bind(this))
                                    .orderBy('orderno', 'asc')
                                    .limit(1);
              if (rows.length > 0) {
                if (rows[0].is_allow) {
                  found = rows[0].is_allow;
                }else{
                  // deny found, stop searching
                  found = false;
                  break;
                }
              }
            }
            if (found === null) {
              const next_ids = [];
              for (const cid of current_context_ids){
                const parent_id = await this.getParentContextId(trx, cid);
                if (parent_id){
                  if (parent_id === -1){
                    // reached root
                    // DO NOTHING
                  } else if (parent_id === -2){
                    // 明確に拒否する
                    allowed = false;
                    await cache.hset(pkey, sskey, 'false');
                    result[action_name] = false;
                    break;
                  }
                  if (parent_id > 0 && next_ids.indexOf(parent_id) < 0){
                    if (await this.isContextEnabled(trx, parent_id) === true){
                      next_ids.push(parent_id);
                    }
                  }
                }
              }
              current_context_ids = next_ids;
            } else {
              allowed = found;
            }
          }
          if (allowed === null) {
            // self permission only
            allowed = await this.isAllowedSelf(trx, userid, actionid,context_ids,selfObject);
          }
          if (allowed === null) allowed = false; // default deny
          if (allowed) {
            await cache.hset(pkey, sskey, allowed.toString());
          }
        }
        result[action_name] = retAllowed(allowed);
      }
    }else{
      result = JSON.parse(allowed);
    }
    await cache.hset(pkey, skey, JSON.stringify(result));
    return result;
  },

  createNewContextOnce: async function(trx, parent_id, name, addRules, force_insert_id) {
    let id = null;
    if (force_insert_id && force_insert_id > 0) {
      const c = await trx.select('id').from('contexts').where('id',force_insert_id).first();
      if (c){
        throw new Error(`Cannot create context with id ${force_insert_id} because it already exists.`);
      }
      const insertRes = await trx('contexts').insert({
        id: force_insert_id,
        parent_id,
        name,
      }).returning('id');
      id = insertRes[0].id;
      if (id !== force_insert_id){
        throw new Error(`Cannot create context with id ${force_insert_id} because the database assigned a different id ${id}.`);
      }
    }else{
      const insertRes = await trx('contexts').insert({
        parent_id,
        name,
      }).returning('id');
      id = insertRes[0].id;
    }
    if (addRules === true){
      // copy rule to access_rules
      // from user_rules
      for (const row of await trx('user_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: id, action_id: row.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: id,
          action_id: row.action_id,
          unit: this.UNIT_USER,
          unit_id: row.user_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_USER_RULES,
          source_id: row.id,
        });
        orderno += 1;
      }
      // from group_rules
      for (const row of await trx('group_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: id, action_id: row.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: id,
          action_id: row.action_id,
          unit: this.UNIT_GROUP,
          unit_id: row.group_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_GROUP_RULES,
          source_id: row.id,
        });
        orderno += 1;
      }
      // from tier_rules
      for (const row of await trx('tier_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: id, action_id: row.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: id,
          action_id: row.action_id,
          unit: this.UNIT_TIER,
          unit_id: row.tier_id,
          is_allow: row.is_allow,
          orderno: orderno,
          source: this.SOURCE_TIER_RULES,
          source_id: row.id,
        });
        orderno += 1;
      }
    }
    return id;
  },
  createNewContext: async function(trx, parent_ids, name, addRules, force_insert_id) {
    const context_ids = [];
    for(const parent_id of parent_ids){
      const context_id = await this.createNewContextOnce(trx, parent_id, name, addRules, force_insert_id);
      context_ids.push(context_id);
    }
    return context_ids;
  },
  addResourceToContext: async function(trx, resource_id, context_id) {
    await trx('map_resource_context').insert({
      resource_id,
      context_id,
    });
    const res = await trx('resources').select('target','target_id').where({ id: resource_id }).first();
     if (res) {
      const keys = await cache.keys(`rules:isAllowed:${res.target}:${res.target_id}:*`);
       await cache.delDirectKeys(keys);
     }
  },
  deleteResourceFromContext: async function(trx, resource_id, context_id) {
    await trx('map_resource_context').where({
      resource_id,
      context_id
    }).del();
    const res = await trx('resources').select('target','target_id').where({ id: resource_id }).first();
     if (res) {
      const keys = await cache.keys(`rules:isAllowed:${res.target}:${res.target_id}:*`);
       await cache.delDirectKeys(keys);
     }
  },

  createResource: async function(trx, target, target_id, parent_target, parent_target_id, isCreateContext, isCreatContextCopyRules) {
    let context_ids = [1]; // default to root
    let parent_context_ids = [1]; // default to root
    // check if already exists
    const cres = await trx('resources').select('id').where({ target, target_id }).first();
    if (cres){
      throw new Error(`Resource already exists for ${target}:${target_id}`);
    }
    // check parent
    if (parent_target_id && parent_target_id > 0) {
      const pres = await trx('resources').select('id').where({ target: parent_target, target_id: parent_target_id }).first();
      if (!pres) {
        throw new Error(`Parent resource not found for ${parent_target}:${parent_target_id}`);
      }
      const pctx = await trx('map_resource_context').select('context_id').where({ resource_id: pres.id }).orderBy('context_id','asc');
      if (!pctx || pctx.length === 0) {
        throw new Error(`Parent resource context not found for ${parent_target}:${parent_target_id}`);
      }
      parent_context_ids = pctx.map(row => row.context_id);
    }
    // insert resource
    const ires = await trx('resources').insert({
      target,
      target_id,
    }).returning('id');
    const resource_id = ires[0].id;
    if (isCreateContext === true) {
      if (isCreatContextCopyRules === true) {
        // create new context as new root
        const vroot_context_ids = await this.createNewContext(trx, [-1], `Resource for ${target}:${target_id}`, true); // copy template
        for(const vroot_context_id of vroot_context_ids){
          await trx('context_copyto').insert({ context_id: vroot_context_id });
        }
        parent_context_ids = vroot_context_ids;
      }
      // create new context as child of parent_context_id
      context_ids = await this.createNewContext(trx, parent_context_ids, `Resource for ${target}:${target_id}`, false); // do not copy template
    }
    for(const context_id of context_ids){
      await trx('map_resource_context').insert({
        resource_id,
        context_id,
      });
    } 
    // invalidate cache
    await cache.del(`rules:resources:${target}:${target_id}`);
    const keys = await cache.keys(`rules:isAllowed:${target}:${target_id}:*`);
    await cache.delDirectKeys(keys);
    return context_ids;
  },
  deleteResource: async function(trx, target, target_id) {
    const cres = await trx('resources').select('id').where({ target, target_id }).first();
    if (!cres) return;
    const resource_id = cres.id;
    const cctx = await trx('map_resource_context').select('context_id').where({ resource_id });
    const context_ids = cctx.map(row => row.context_id);
    await trx('resources').where({ target, target_id }).del();
    await trx('map_resource_context').where({ resource_id }).del();
    // check if any other resources use the same context_ids
    const stillUsedContexts = new Set(
      (await trx('map_resource_context')
        .distinct('context_id')
        .whereIn('context_id', context_ids))
        .map(row => row.context_id)
    );
    for(const context_id of context_ids){
      if (!stillUsedContexts.has(context_id)) {
        // no other resources use this context_id, so delete it
        await trx('contexts').where({ id: context_id }).del();
        // access_rules delete
        await trx('access_rules').where({ context_id }).del();
      }
    }
    // invalidate cache
    await cache.del(`rules:resources:${target}:${target_id}`);
    const keys = await cache.keys(`rules:isAllowed:${target}:${target_id}:*`);
    await cache.delDirectKeys(keys);
  },
  cloneResourceInheritanceIfNeeded: async function(trx, target, target_id) {
    const cres = await trx('resources').select('id').where({ target, target_id }).first();
    if (!cres) throw new Error(`Resource ${target}:${target_id} does not exist.`);
    const cctx = await trx('map_resource_context').select('context_id').where({ resource_id: cres.id }).orderBy('context_id','asc');
    if (!cctx || cctx.length === 0) throw new Error(`Resource context for ${target}:${target_id} does not exist.`);
    const context_ids = cctx.map(row => row.context_id);
    // check if other resources use the same context_ids
    const ores = await trx('map_resource_context').select('resource_id').whereIn('context_id', context_ids).andWhereNot({ resource_id: cres.id }).limit(1).first();
    // check if any other contexts use the same parent_id
    const pces = await trx('contexts').select('id').whereIn('parent_id', context_ids).limit(1).first();
    if (ores || pces) {
      // other resources use this context_ids, so clone it
      const new_context_id = await this.createNewContext(trx, context_ids, `Cloned inheritance for ${target}:${target_id}`, false, false);
      // copy access_rules
      for (const row of await trx('access_rules').whereIn('context_id', context_ids)) {
        await trx('access_rules').insert({
          context_id: new_context_id,
          action_id: row.action_id,
          unit: row.unit,
          unit_id: row.unit_id,
          is_allow: row.is_allow,
          orderno: row.orderno,
          source: row.source,
          source_id: row.source_id,
        });
      }
      // update resource to new context_id
      await trx('map_resource_context').where({ resource_id: cres.id }).update({ context_id: new_context_id });
      // invalidate cache
      await cache.del(`rules:resources:${target}:${target_id}`);
      const keys = await cache.keys(`rules:isAllowed:${target}:${target_id}:*`);
      await cache.delDirectKeys(keys);
      return new_context_id;
    }
    return context_id;
  },
  _accessRuleCacheDelByContextId: async function(trx, context_id) {
    // disable cache for this context_id
    const resourcesToInvalidate = await trx('map_resource_context as m')
                                        .join('resources as r', 'm.resource_id', 'r.id')
                                        .select('r.target', 'r.target_id')
                                        .where('m.context_id', context_id);
    for(const row of resourcesToInvalidate){
      const keys = await cache.keys(`rules:isAllowed:${row.target}:${row.target_id}:*`);
      await cache.delDirectKeys(keys);
    }
  },
  pushAccessRule: async function(trx, context_id, action_id, unit, unit_id, is_allow, source, source_id) {
    const maxccnt = await trx('access_rules').max('orderno as maxorderno').where({ context_id, action_id }).first();
    let orderno = 1;
    if (maxccnt && maxccnt.maxorderno) orderno = maxccnt.maxorderno + 1;
    await trx('access_rules').insert({
      context_id,
      action_id,
      unit,
      unit_id,
      is_allow,
      orderno,
      source,
      source_id,
    });
    // disable cache for this context_id
    await this._accessRuleCacheDelByContextId(trx, context_id);
  },
  unshiftAccessRule: async function(trx, context_id, action_id, unit, unit_id, is_allow, source, source_id) {
    const minccnt = await trx('access_rules').min('orderno as minorderno').where({ context_id, action_id }).first();
    let orderno = 1;
    if (minccnt && minccnt.minorderno) orderno = minccnt.minorderno - 1;
    await trx('access_rules').insert({
      context_id,
      action_id,
      unit,
      unit_id,
      is_allow,
      orderno,
      source,
      source_id,
    });
    // disable cache for this context_id
    await this._accessRuleCacheDelByContextId(trx, context_id);
  },
  deleteAccessRule: async function(trx, id) {
    await trx('access_rules').where({ id }).del();
    // disable cache for this context_id
    await this._accessRuleCacheDelByContextId(trx, context_id);
  },
  updateAccessRuleAllow: async function(trx, id, is_allow) {
    await trx('access_rules').where({ id }).update({ is_allow });
    // disable cache for this context_id
    await this._accessRuleCacheDelByContextId(trx, context_id);
  },
  getAccessRules: async function(trx, context_id) {
    let rules = [];
    for (const row of await trx('access_rules').where({ context_id }).orderBy(['action_id', { column: 'orderno', order: 'asc' }])) {
      // process each row
      rules.push({
        id: row.id,
        context_id: row.context_id,
        action_id: row.action_id,
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
  setAccessRule: async function(trx, context_id, fields) {
    trx('access_rules').where({ context_id }).del();
    let orderno = 1;
    for (const row of fields) {
      if (!row.action_id || !row.unit || row.is_allow === undefined || row.is_allow === null) continue;
      if (row.unit === this.UNIT_ALL) row.unit_id = 0;
      if (row.unit_id === undefined || row.unit_id === null) continue;
      // insert
      await trx('access_rules').insert({
        context_id,
        action_id: row.action_id,
        unit: row.unit,
        unit_id: row.unit_id,
        is_allow: row.is_allow,
        orderno: orderno,
        source: row.source || this.SOURCE_DIRECT,
        source_id: row.source_id || 0,
      });
      orderno++;
    }
    // disable cache for this context_id
    await this._accessRuleCacheDelByContextId(trx, context_id);
  },
  getResourceIdByTarget: async function(trx, target, target_id) {
    let resource_id = await cache.hget(`rules:resources:${target}:${target_id}`, 'id');
    if (resource_id !== undefined && resource_id !== null) return utils.parseSafeInt(resource_id);
    // not in cache, check db
    const res = await trx('resources').select('id','target_id').where({ target }).where({ target_id });
    resource_id = res ? res.id : null;
    if (resource_id !== null) {
      await cache.hset(`rules:resources:${target}:${target_id}`, 'id', resource_id.toString());
    }
    return resource_id;
  },
  getContextIds: async function(trx, target, target_id) {
    let context_ids = await cache.hget(`rules:resources:${target}:${target_id}`, 'context_ids');
    if (context_ids !== undefined && context_ids !== null) return JSON.parse(context_ids);
    // not in cache, check db
    const resource_id = await this.getResourceIdByTarget(trx, target, target_id);
    if (!resource_id) return [];
    const cctx = await trx('map_resource_context').select('context_id').where({ resource_id }).orderBy('context_id','asc');
    context_ids = cctx ? cctx.map(r => r.context_id) : [];
    if (context_ids.length > 0) {
      await cache.hset(`rules:resources:${target}:${target_id}`, 'context_ids', JSON.stringify(context_ids));
    }
    return context_ids;
  },
  getParentContextId: async function(trx, context_id) {
    if (context_id <= 0) return null;
    let parent_context_id = await cache.hget(`rules:context_parent`, context_id.toString());
    if (parent_context_id !== undefined && parent_context_id !== null) {
      return utils.parseSafeInt(parent_context_id);
    }
    // not in cache, check db
    const cres = await trx('contexts').select('parent_id').where({ id: context_id }).first();
    parent_context_id = cres ? cres.parent_id : null;
    if (parent_context_id !== null) {
      await cache.hset(`rules:context_parent`, context_id.toString(), parent_context_id.toString());
    }
    return parent_context_id;
  },
  _deleteCacheForUserRules: async function(trx, userid) {
    await cache.del(`rules:user:${userid}`);
  },
  _deleteCacheForGroupRules: async function(trx, groupid) {
    await cache.del(`rules:groups:${groupid}`);
  },
  _deleteCacheForTierRules: async function(trx, tierid) {
    await cache.del(`rules:tiers:${tierid}`);
  },
  _deleteCacheForContextRules: async function(trx, context_id) {
    await cache.del(`rules:context:${context_id}`);
    // invalidate all resources under this context
    const resourcesToInvalidate = await trx('map_resource_context as m')
                                        .join('resources as r', 'm.resource_id', 'r.id')
                                        .select('r.target', 'r.target_id')
                                        .where('m.context_id', context_id);
    for(const row of resourcesToInvalidate){
      const keys = await cache.keys(`rules:isAllowed:${row.target}:${row.target_id}:*`);
      await cache.delDirectKeys(keys);
      await cache.del(`rules:resources:${row.target}:${row.target_id}`);
    }
  },
  _getEnabledValue: function(is_enabled) {
    if (is_enabled === true || is_enabled === 1 || is_enabled === '1' || is_enabled === 'true') {
      return true;
    }
    if (is_enabled === false || is_enabled === 0 || is_enabled === '0' || is_enabled === 'false') {
      return false;
    }
    return null;
  },
  isUserEnabled: async function(trx, userid) {
    let isEnabled = await cache.hget(`rules:user:${userid}`, 'isEnabled');
    if (isEnabled !== undefined && isEnabled !== null) isEnabled = this._getEnabledValue(isEnabled);
    if (isEnabled !== null) return isEnabled;
    // not in cache, check db
    const row = await trx('users').select('is_enabled').where({ id: userid }).first();
    isEnabled = row ? row.is_enabled : null;
    if (isEnabled !== null) {
      await cache.hset(`rules:user:${userid}`, 'isEnabled', isEnabled.toString());
    }
    return isEnabled;
  },
  isGroupEnabled: async function(trx, groupid) {
    let isEnabled = await cache.hget(`rules:groups:${groupid}`, 'isEnabled');
    if (isEnabled !== undefined && isEnabled !== null) isEnabled = this._getEnabledValue(isEnabled);
    if (isEnabled !== null) return isEnabled;
    // not in cache, check db
    const row = await trx('groups').select('is_enabled').where({ id: groupid }).first();
    isEnabled = row ? row.is_enabled : null;
    if (isEnabled !== null) {
      await cache.hset(`rules:groups:${groupid}`, 'isEnabled', isEnabled.toString());
    }
    return isEnabled;
  },
  isTierEnabled: async function(trx, tierid) {
    let isEnabled = await cache.hget(`rules:tiers:${tierid}`, 'isEnabled');
    if (isEnabled !== undefined && isEnabled !== null) isEnabled = this._getEnabledValue(isEnabled);
    if (isEnabled !== null) return isEnabled;
    // not in cache, check db
    const row = await trx('tiers').select('is_enabled').where({ id: tierid }).first();
    isEnabled = row ? row.is_enabled : null;
    if (isEnabled !== null) {
      await cache.hset(`rules:tiers:${tierid}`, 'isEnabled', isEnabled.toString());
    }
    return isEnabled;
  },
  isContextEnabled: async function(trx, context_id) {
    let isEnabled = await cache.hget(`rules:context:${context_id}`, 'isEnabled');
    if (isEnabled !== undefined && isEnabled !== null) isEnabled = this._getEnabledValue(isEnabled);
    if (isEnabled !== null) return isEnabled;
    // not in cache, check db
    const row = await trx('contexts').select('is_enabled').where({ id: context_id }).first();
    isEnabled = row ? row.is_enabled : null;
    if (isEnabled !== null) {
      await cache.hset(`rules:context:${context_id}`, 'isEnabled', isEnabled.toString());
    }
    return isEnabled;
  },
  updatedUserData: async function(trx, userid, isUpdateEnabled) {
    await cache.del(`user:id:${userid}`);
    await cache.del(`rules:user:${userid}`);
    if (isUpdateEnabled === true) {
      await this._deleteCacheForUserRules(trx, userid);
    }
  },
  updatedGroupData: async function(trx, group_id, name,isUpdateEnabled) {
    await cache.del(`group:id:${group_id}`);
    await cache.del(`rules:groups:${name}`);
    if (isUpdateEnabled === true) {
      await this._deleteCacheForGroupRules(trx, group_id);
    }
  },
  updatedTierData: async function(trx, tierid,isUpdateEnabled) {
    await cache.del(`rules:tier:${tierid}`);
    if (isUpdateEnabled === true) {
      await this._deleteCacheForTierRules(trx, tierid);
    }
  },
  updatedRules: async function(trx) {
    // copy all user_rules, group_rules, tier_rules to access_rules
    for (const row of await trx('context_copyto').select('context_id').orderBy('context_id','asc')) {
      // delete existing rules in access_rules
      await trx('access_rules').where({ context_id: row.context_id, unit: this.UNIT_USER }).del();
      await trx('access_rules').where({ context_id: row.context_id, unit: this.UNIT_GROUP }).del();
      await trx('access_rules').where({ context_id: row.context_id, unit: this.UNIT_TIER }).del();
      // from user_rules
      for (const ur of await trx('user_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: row.context_id, action_id: ur.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: row.context_id,
          action_id: ur.action_id,
          unit: this.UNIT_USER,
          unit_id: ur.user_id,
          is_allow: ur.is_allow,
          orderno: orderno,
          source: this.SOURCE_USER_RULES,
          source_id: ur.id,
        });
      }
      // from group_rules
      for (const gr of await trx('group_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: row.context_id, action_id: gr.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: row.context_id,
          action_id: gr.action_id,
          unit: this.UNIT_GROUP,
          unit_id: gr.group_id,
          is_allow: gr.is_allow,
          orderno: orderno,
          source: this.SOURCE_GROUP_RULES,
          source_id: gr.id,
        });
      }
      // from tier_rules
      for (const tr of await trx('tier_rules').select('*').orderBy('id','asc')) {
        let orderno = 1;
        const maxorderno = await trx('access_rules').max('orderno as maxorderno').where({ context_id: row.context_id, action_id: tr.action_id }).first();
        if (maxorderno && maxorderno.maxorderno) orderno = maxorderno.maxorderno + 1;
        await trx('access_rules').insert({
          context_id: row.context_id,
          action_id: tr.action_id,
          unit: this.UNIT_TIER,
          unit_id: tr.tier_id,
          is_allow: tr.is_allow,
          orderno: orderno,
          source: this.SOURCE_TIER_RULES,
          source_id: tr.id,
        });
      }
      // invalidate cache for this context
      await this._deleteCacheForContextRules(trx, row.context_id);
    }
  },
  updateContextData: async function(trx, context_id,isUpdateEnabled) {
    await cache.hdel(`rules:context_parent`, context_id.toString());
    if (isUpdateEnabled === true) {
      await this._deleteCacheForContextRules(trx, context_id);
    }
  },
  getGroupIdByName: async function(trx, name) {
    let group_id = await cache.hget(`rules:groups:${name}`, 'id');
    if (group_id !== undefined && group_id !== null) return utils.parseSafeInt(group_id);
    const row = await trx('groups').select('id').where({ group_id: name }).first();
    group_id = row ? row.id : null;
    if (group_id !== null) {
      await cache.hset(`rules:groups:${name}`, 'id', group_id.toString());
    }
    return group_id;
  },
  getParentGroupId: async function(trx, groupid) {
    let parent_group_id = await cache.hget(`rules:group_parent`, groupid.toString());
    if (parent_group_id !== undefined && parent_group_id !== null) {
      return utils.parseSafeInt(parent_group_id);
    }
    // not in cache, check db
    const cres = await trx('groups').select('parent_id').where({ id: groupid }).first();
    parent_group_id = cres ? cres.parent_id : null;
    if (parent_group_id !== null) {
      await cache.hset(`rules:group_parent`, groupid.toString(), parent_group_id.toString());
    }
    return parent_group_id;
  },
  getGroupIdsByUser: async function(trx, userid) {
    let group_ids = await cache.hget(`rules:usergroups:${userid}`, 'group_ids');
    if (group_ids !== undefined && group_ids !== null) {
      group_ids = JSON.parse(group_ids);
      return group_ids;
    }
    // not in cache, check db
    const rows = await trx('map_usergroup').select('group_id').where({ user_id: userid });
    group_ids = rows.map(r => r.group_id);
    await cache.hset(`rules:usergroups:${userid}`, 'group_ids', JSON.stringify(group_ids));
    return group_ids;
  },
  getFullEnabledGroupIdsByUser: async function(trx, userid) {
    let all_group_ids = await cache.hget(`rules:usergroups:${userid}`, 'all_enabled_group_ids');
    if (all_group_ids !== undefined && all_group_ids !== null) {
      all_group_ids = JSON.parse(all_group_ids);
      return all_group_ids;
    }
    // not in cache, compute
    let direct_group_ids = await this.getGroupIdsByUser(trx, userid); // ensure cache
    if (direct_group_ids.length === 0) return [];
    const all = await trx.withRecursive('all_groups', (qb) => {
      qb.select('id', 'parent_id', 'enabled')
        .from('groups')
        .whereIn('id', direct_group_ids)
        .unionAll(function() {
          this.select('g.id', 'g.parent_id', 'g.enabled')
              .from('groups as g')
              .join('all_groups as ag', 'g.id', 'ag.parent_id')
              .where('g.parent_id', '>', 0)
              .andWhere('g.is_enabled', true);
        });
    }).select('distinct id').from('all_groups');
    all_group_ids = all.map(r => r.id);
    await cache.hset(`rules:usergroups:${userid}`, 'all_enabled_group_ids', JSON.stringify(all_group_ids));
    return all_group_ids;
  },
  checkUserInGroup: async function(trx, userid, groupid) {
    let group_ids = await this.getGroupIdsByUser(trx, userid); // ensure cache
    return group_ids.indexOf(groupid) >= 0;
  },
  addGroup: async function(trx, userid, groupid) {
    await trx('map_usergroup').insert({ user_id: userid, group_id: groupid });
    await cache.del(`rules:usergroups:${userid}`);
    await cache.del(`rules:usertiers:${userid}`);
    await cache.del(`rules:onlyusertiers:${userid}`);
    await this._deleteCacheForUserRules(trx, userid);
    await this._deleteCacheForGroupRules(trx, groupid);
  },
  removeGroup: async function(trx, userid, groupid) {
    await trx('map_usergroup').where({ user_id: userid, group_id: groupid }).del();
    await cache.del(`rules:usergroups:${userid}`);
    await cache.del(`rules:usertiers:${userid}`);
    await cache.del(`rules:onlyusertiers:${userid}`);
    await this._deleteCacheForUserRules(trx, userid);
    await this._deleteCacheForGroupRules(trx, groupid);
  },
  getTierNameById: async function(trx, tierid) {
    let tier_name = await cache.hget(`rules:tiers:id:${tierid}`, 'name');
    if (tier_name !== undefined && tier_name !== null) return tier_name;
    const row = await trx('tiers').select('name').where({ id: tierid }).first();
    tier_name = row ? row.name : null;
    if (tier_name !== null) {
      await cache.hset(`rules:tiers:id:${tierid}`, 'name', tier_name);
    }
    return tier_name;
  },
  getTierIdByName: async function(trx, name) {
    let tier_id = await cache.hget(`rules:tiers:${name}`, 'id');
    if (tier_id !== undefined && tier_id !== null) return utils.parseSafeInt(tier_id);
    const row = await trx('tiers').select('id').where({ name }).first();
    tier_id = row ? row.id : null;
    if (tier_id !== null) {
      await cache.hset(`rules:tiers:${name}`, 'id', tier_id.toString());
    }
    return tier_id;
  },
  getTierIdsByUserOnlyOneContext: async function(trx, userid, context_id) {    
    let tier_ids = await cache.hget(`rules:onlyusertiers:${userid}`, context_id.toString() );
    if (tier_ids !== undefined && tier_ids !== null) {
      return JSON.parse(tier_ids);
    }
    // not in cache, check db
    const rows = await trx('map_usertier').select('tier_id').where({ user_id: userid, context_id: context_id });
    tier_ids = rows.map(r => r.tier_id);
    await cache.hset(`rules:onlyusertiers:${userid}`, context_id.toString(), JSON.stringify(tier_ids));
    return tier_ids;
  },
  getTierIdsByUserOnly: async function(trx, userid, context_ids) {
    let all_tier_ids = await cache.hget(`rules:onlyusertiers:${userid}`, context_ids.sort().join(','));
    if (all_tier_ids !== undefined && all_tier_ids !== null) {
      return JSON.parse(all_tier_ids);
    }
    let tier_ids = [];
    for(const context_id of context_ids){
      let tids = await this.getTierIdsByUserOnlyOneContext(trx, userid, context_id); // ensure cache
      tier_ids = tier_ids.concat(tids);
    }
    await cache.hset(`rules:usertiers:${userid}`, context_ids.sort().join(','), JSON.stringify(tier_ids));
    return tier_ids;
  },
  getTierIdsByGroupOneContext: async function(trx, groupids, context_id) {
    let tier_ids = await cache.hget(`rules:onlygroupstiers:${groupids.sort().join(',')}`, context_id.toString());
    if (tier_ids !== undefined && tier_ids !== null) {
      return JSON.parse(tier_ids);
    }
    // not in cache, check db
    tier_ids = [];
    for(const groupid of groupids){
      let tier_ids_gid = await cache.hget(`rules:onlygrouptiers:${groupid}`, context_id.toString());
      if (tier_ids_gid !== undefined && tier_ids_gid !== null) {
        tier_ids = tier_ids.concat(JSON.parse(tier_ids_gid));
      }else{
        const rows = await trx('map_grouptier').select('tier_id').where({ group_id: groupid, context_id: context_id });
        let tids = rows.map(r => r.tier_id);
        tier_ids = tier_ids.concat(tids);
        await cache.hset(`rules:onlygrouptiers:${groupid}`, context_id.toString(), JSON.stringify(tids));
      }
    }
    await cache.hset(`rules:onlygrouptiers:${groupids.sort().join(',')}`, context_id.toString(), JSON.stringify(tier_ids));
    return tier_ids;
  },
  getTierIdsByGroup: async function(trx, groupids, context_ids) {
    let all_tier_ids = await cache.hget(`rules:grouptiers:${groupids.join(',')}`, context_ids.sort().join(','));
    if (all_tier_ids !== undefined && all_tier_ids !== null) {
      return JSON.parse(all_tier_ids);
    }
    let tier_ids = [];
    for(const context_id of context_ids){
      let tids = await this.getTierIdsByGroupOneContext(trx, groupids, context_id); // ensure cache
      tier_ids = tier_ids.concat(tids);
    }
    await cache.hset(`rules:grouptiers:${groupids.sort().join(',')}`, context_ids.sort().join(','), JSON.stringify(tier_ids));
    return tier_ids;
  },
  getTierIdsByUser: async function(trx, userid, context_ids) {
    let all_tier_ids = await cache.hget(`rules:usertiers:${userid}`, context_ids.sort().join(','));
    if (all_tier_ids !== undefined && all_tier_ids !== null) {
      return JSON.parse(all_tier_ids);
    }
    // get tier for user
    let tier_ids = await this.getTierIdsByUserOnly(trx, userid, context_ids); // ensure cache
    // get tier for groups
    let group_ids = await this.getGroupIdsByUser(trx, userid); // ensure cache
    if (group_ids.length > 0) {
      let tgids = await this.getTierIdsByGroup(trx, group_ids, context_ids); // ensure cache
      tier_ids = tier_ids.concat(tgids);
    }
    // unique
    tier_ids = [...new Set(tier_ids)];
    await cache.hset(`rules:usertiers:${userid}`, context_ids.sort().join(','), JSON.stringify(tier_ids));
    return tier_ids;
  },
  checkUserOnlyInTier: async function(trx, userid, tierid, context_ids) {
    let tier_ids = await this.getTierIdsByUser(trx, userid, context_ids); // ensure cache
    return tier_ids.indexOf(tierid) >= 0;
  },
  checkGroupInTier: async function(trx, groupid, tierid, context_ids) {
    let tier_ids = await this.getTierIdsByGroup(trx, groupid, context_ids); // ensure cache
    return tier_ids.indexOf(tierid) >= 0;
  },
  checkUserInTier: async function(trx, userid, tierid, context_ids) {
    if (await this.checkUserOnlyInTier(trx, userid, tierid, context_ids)) return true;
    // check groups
    const group_ids = await this.getGroupIdsByUser(trx, userid);
    if (group_ids.length === 0) return false;
    for(const gid of group_ids){
      if (await this.checkGroupInTier(trx, gid, tierid, context_ids)) return true;
    }
    return false;
  },
  addTier_User: async function(trx, userid, tierid, context_id) {
    await trx('map_usertier').insert({ user_id: userid, tier_id: tierid, context_id: context_id });
    await cache.del(`rules:onlyusertiers:${userid}`);
    await cache.del(`rules:usertiers:${userid}`);
  },
  removeTier_User: async function(trx, userid, tierid, context_id) {
    await trx('map_usertier').where({ user_id: userid, tier_id: tierid, context_id: context_id }).del();
    await cache.del(`rules:onlyusertiers:${userid}`);
    await cache.del(`rules:usertiers:${userid}`);
  },
  addTier_Group: async function(trx, groupid, tierid, context_id) {
    await trx('map_grouptier').insert({ group_id: groupid, tier_id: tierid, context_id: context_id });
    // invalidate all users in this group
    for(const row of await trx('map_usergroup').select('user_id').where({ group_id: groupid })){
      await cache.del(`rules:usertiers:${row.user_id}`);
      await cache.del(`rules:onlyusertiers:${row.user_id}`);
    }
    await cache.del(`rules:onlygrouptiers:${groupid}`);
    await cache.del(`rules:grouptiers:${groupid}`);
    await cache.run(async (wclient)=>{
      const keys = await wclient.keys('rules:onlygroupstiers:*');
      return await this.client.del(keys);
    });
  },
  removeTier_Group: async function(trx, groupid, tierid, context_id) {
    await trx('map_grouptier').where({ group_id: groupid, tier_id: tierid, context_id: context_id }).del();
    // invalidate all users in this group
    for(const row of await trx('map_usergroup').select('user_id').where({ group_id: groupid })){
      await cache.del(`rules:usertiers:${row.user_id}`);
      await cache.del(`rules:onlyusertiers:${row.user_id}`);
    }
    await cache.del(`rules:onlygrouptiers:${groupid}`);
    await cache.del(`rules:grouptiers:${groupid}`);
    await cache.run(async (wclient)=>{
      const keys = await wclient.keys('rules:onlygroupstiers:*');
      return await this.client.del(keys);
    });
  },
};