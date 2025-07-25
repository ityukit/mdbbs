import init from './init.js';

const settings = init();

export default class Cache {
  constructor() {
    this.cache = settings.global[settings.global.cache.type];
    if (this.cache === 'redis') {
      this.cache = import('./cache/redis.js').then((module) => new module.default(settings));
    } else if (this.cache === 'memory') {
      this.cache = import('./cache/memory.js').then((module) => new module.default(settings));
    } else {
      throw new Error(`Unsupported cache type: ${settings.global[settings.global.cache.type]}`);
    }
  }

  async run(callback) {
    const cacheInstance = await this.cache;
    return cacheInstance.run(callback);
  }
}
