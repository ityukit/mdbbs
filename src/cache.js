import init from './init.js';

const settings = init.getSettings();
const redis = await import('./cache/redis.js').then((module) => new module.default(settings));
const memory = await import('./cache/memory.js').then((module) => new module.default(settings));

class Cache {
  constructor() {
    if (!Cache.instance) {
      this.cache = null;
      this.cacheType = settings.config.cache.type;
      this.cacheConfig = settings.config.cache[settings.config.cache.type];
      if (this.cacheType === 'redis') {
        this.cache = redis;
      } else if (this.cacheType === 'memory') {
        this.cache = memory;
      } else {
        throw new Error(`Unsupported cache type: ${this.cacheType}`);
      }
      this.initialized = false;
      Cache.instance = this;
    }
    return Cache.instance;
  }
  async run(callback) {
    return await this.cache.run(callback);
  }
  // shorthand methods
  async get(key) {
    return await this.run(async (client) => {
      return await client.get(key);
    });
  }
  async set(key, value) {
    return await this.run(async (client) => {
      return await client.set(key, value);
    });
  }
  async del(key) {
    return await this.run(async (client) => {
      return await client.del(key);
    });
  }
  async exists(key) {
    return await this.run(async (client) => {
      return await client.exists(key);
    });
  }
  async keys(pattern) {
    return await this.run(async (client) => {
      return await client.keys(pattern);
    });
  }
  async delDirectKeys(keys) {
    return await this.run(async (client) => {
      return await client.delDirectKeys(keys);
    });
  }
  async hgetall(key) {
    return await this.run(async (client) => {
      return await client.hgetall(key);
    });
  }
  async hset(key, field, value) {
    return await this.run(async (client) => {
      return await client.hset(key, field, value);
    });
  }
  async hdel(key, field) {
    return await this.run(async (client) => {
      return await client.hdel(key, field);
    });
  }
  async hget(key, field) {
    return await this.run(async (client) => {
      return await client.hget(key, field);
    });
  }
  async hkeys(key) {
    return await this.run(async (client) => {
      return await client.hkeys(key);
    });
  }
  async hvals(key) {
    return await this.run(async (client) => {
      return await client.hvals(key);
    });
  }
  async expire(key, seconds) {
    return await this.run(async (client) => {
      return await client.expire(key, seconds);
    });
  }
  async clearAll() {
    return await this.run(async (client) => {
      return await client.clearAll();
    });
  }
}
const cache = new Cache();

export default cache;
