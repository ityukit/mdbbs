import init from './init.js';

const settings = init();

export default class Cache {
  constructor() {
    this.cache = null;
    this.cacheType = settings.global.cache.type;
    this.cacheConfig = settings.global[settings.global.cache.type];
    if (this.cacheType === 'redis') {
      this.cache = import('./cache/redis.js').then((module) => new module.default(settings));
    } else if (this.cacheType === 'memory') {
      this.cache = import('./cache/memory.js').then((module) => new module.default(settings));
    } else {
      throw new Error(`Unsupported cache type: ${this.cacheType}`);
    }
  }

  async run(callback) {
    const cacheInstance = await this.cache;
    return cacheInstance.run(callback);
  }
}
