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
      return await client.get(`user:${id}`);
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
      await client.set(`user:${id}`, ud);
    })
    return this._convertUserJsonToData(ud);
  }
}

const instance = new CacheUser();
await instance._init();
export default instance;
