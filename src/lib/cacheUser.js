import cache from '../cache.js'
import database from '../database.js'

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
  async getUserById(id, db_trx){
    const cachedUser = await this.cache.run(async (client) =>{
      return await client.get(`user:${id}`);
    })
    if (cachedUser){
      const user = JSON.parse(cachedUser);
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
      created_at: dbuser.created_at,
      updated_at: dbuser.updated_at,
      __expires: Date.now() + 10 * 60 * 1000 // cache for 10 minutes
    }
    await this.cache.run(async (client) =>{
      await client.set(`user:${id}`, JSON.stringify(user));
    })
    return user;
  }
}

const instance = new CacheUser();
await instance._init();
export default instance;
