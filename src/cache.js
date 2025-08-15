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
      Cache.instance = this;
    }
    return Cache.instance;
  }

  run(callback) {
    return this.cache.run(callback);
  }
}

const cache = new Cache();

export default cache;
