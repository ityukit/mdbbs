import cache from '../cache.js'
import database from '../database.js'
import init from '../init.js';

const settings = init.getSettings();

class CacheUser{
  constructor(){
    if (!CacheUser.instance) {
      this.cache = cache;
      this.database = database;
      this.initialized = false;
      CacheUser.instance = this;
    }
    return CacheUser.instance;
  }
  async _init(){
    if (this.initialized) return;
    this.initialized = true;
  }
  _convertDate(d){
    if (d instanceof Date) return d;
    return settings.datetool.parse(d.toString());
  }
  _convertUserJsonToData(d){
    const j = JSON.parse(d);
    return {
      id: j.id,
      login_id: j.login_id,
      display_name: j.display_name,
      email: j.email,
      description: j.description,
      visibled: j.visibled,
      enabled: j.enabled,
      locked: j.locked,
      activated: j.activated,
      verified_email: j.verified_email,
      created_at: this._convertDate(j.created_at),
      updated_at: this._convertDate(j.updated_at),
      __expires: j.__expires,
    };
  }
  async getUserById(id, db_trx){
    const cachedUser = await this.cache.run(async (client) =>{
      return await client.get(`user:id:${id}`);
    })
    if (cachedUser){
      const user = this._convertUserJsonToData(cachedUser);
      if (user.__expires > Date.now()) return user;
    }
    if (!db_trx) db_trx = await this.database;
    const dbuser = (await db_trx.select(
      'id',
      'login_id',
      'display_name',
      'email',
      'description',
      'visibled',
      'enabled',
      'locked',
      'activated',
      'verified_email',
      'created_at',
      'updated_at'
    ).from('users').where('id', id).first());
    const user = {
      id: dbuser.id,
      login_id: dbuser.login_id,
      display_name: dbuser.display_name,
      email: dbuser.email,
      description: dbuser.description,
      visibled: dbuser.visibled,
      enabled: dbuser.enabled,
      locked: dbuser.locked,
      activated: dbuser.activated,
      verified_email: dbuser.verified_email,
      created_at: this._convertDate(dbuser.created_at),
      updated_at: this._convertDate(dbuser.updated_at),
      __expires: Date.now() + 10 * 60 * 1000 // cache for 10 minutes
    }
    const ud = JSON.stringify(user)
    await this.cache.run(async (client) =>{
      await client.set(`user:id:${id}`, ud);
    })
    return this._convertUserJsonToData(ud);
  }
  _convertGroupJsonToData(d){
    const j = JSON.parse(d);
    return {
      id: j.id,
      group_id: j.group_id,
      display_name: j.display_name,
      description: j.description,
      visibled: j.visibled,
      enabled: j.enabled,
      locked: j.locked,
      parent_group_id: j.parent_group_id,
      created_user_id: j.created_user_id,
      updated_user_id: j.updated_user_id,
      created_at: this._convertDate(j.created_at),
      updated_at: this._convertDate(j.updated_at),
      __expires: j.__expires,
    };
  }
  async getGroupById(id, db_trx){
    const cachedGroup = await this.cache.run(async (client) =>{
      return await client.get(`group:id:${id}`);
    })
    if (cachedGroup){
      const group = this._convertGroupJsonToData(cachedGroup);
      if (group.__expires > Date.now()) return group;
    }
    if (!db_trx) db_trx = await this.database;
    const dbgroup = (await db_trx.select(
      'id',
      'group_id',
      'display_name',
      'description',
      'visibled',
      'enabled',
      'locked',
      'parent_group_id',
      'created_user_id',
      'updated_user_id',
      'created_at',
      'updated_at'
    ).from('groups').where('id', id).first());
    const group = {
      id: dbgroup.id,
      group_id: dbgroup.group_id,
      display_name: dbgroup.display_name,
      description: dbgroup.description,
      visibled: dbgroup.visibled,
      enabled: dbgroup.enabled,
      locked: dbgroup.locked,
      parent_group_id: dbgroup.parent_group_id,
      created_user_id: dbgroup.created_user_id,
      updated_user_id: dbgroup.updated_user_id,
      created_at: this._convertDate(dbgroup.created_at),
      updated_at: this._convertDate(dbgroup.updated_at),
      __expires: Date.now() + 10 * 60 * 1000 // cache for 10 minutes
    }
    const ud = JSON.stringify(group)
    await this.cache.run(async (client) =>{
      await client.set(`group:id:${id}`, ud);
    })
    return this._convertGroupJsonToData(ud);
  }
}

const instance = new CacheUser();
await instance._init();
export default instance;
