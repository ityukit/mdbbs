import { fileURLToPath } from 'node:url';
import { LRUCache } from 'lru-cache'
import loggerGenerator, {moduleFilepathGenerator,moduleNameGenerator} from '../logger.js';
import { max } from 'lodash';

const __filename = fileURLToPath(import.meta.url);

class MemoryClientWrapper {
  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }
  async get(key) {
    return this.client.get(this.prefix + key);
  }
  async set(key, value) {
    return this.client.set(this.prefix + key, value);
  }
  async del(key) {
    return this.client.delete(this.prefix + key);
  }
  async exists(key) {
    return this.client.has(this.prefix + key);
  }
  async keys(pattern) {
    // LRUCache does not support pattern matching like Redis, so we return all keys
    return Array.from(this.client.keys()).filter(key => key.startsWith(this.prefix + pattern));
  }
  async hgetall(key) {
    return this.client.get(this.prefix + key);
  }
  async hset(key, field, value) {
    if (!this.client.has(this.prefix + key)) {
      this.client.set(this.prefix + key, {});
    }
    const current = this.client.get(this.prefix + key);
    current[field] = value;
    this.client.set(this.prefix + key, current);
    return this.client.get(this.prefix + key);
  }
  async hdel(key, field) {
    const current = this.client.get(this.prefix + key);
    delete current[field];
    this.client.set(this.prefix + key, current);
    return this.client.get(this.prefix + key);
  }
  async hget(key, field) {
    const current = this.client.get(this.prefix + key);
    return current ? current[field] : undefined;
  }
  async hkeys(key) {
    const current = this.client.get(this.prefix + key);
    return current ? Object.keys(current) : [];
  }
  async hvals(key) {
    const current = this.client.get(this.prefix + key);
    return current ? Object.values(current) : [];
  }
  async expire(key, seconds) {
    // LRUCache does not support expiration, so we ignore this
    return true; // Indicating success
  }
}

export default class Memory {
  constructor(setting, filepath) {
    this.setting = setting;
    this.logger = loggerGenerator(setting);
    this.clientOption = {
      max: setting.config.memory.max || 1000, // Default max size
      ttl: setting.config.memory.ttl || 1000 * 60 * 60, // Default TTL 1 hour
    };
    this.client = new LRUCache(this.clientOption);
    this.base_prefix = '';
    this.module_prefix = '';
    if (filepath !== undefined && filepath !== null) {
      filepath = moduleFilepathGenerator(1);
    }
    this.module_prefix = moduleNameGenerator(filepath).replaceAll('/', ':');
    while (this.module_prefix.startsWith(':')) {
      this.module_prefix = this.module_prefix.substring(1);
    }
    if (this.module_prefix !== '') {
      this.module_prefix += ':';
    }
    this.prefix = this.base_prefix;
    this.prefix += this.module_prefix;
  }

  async run(callback) {
    this.logger.trace('in run');
    let ret;
    try {
      ret = await callback(new MemoryClientWrapper(this.client, this.prefix));
    } catch (e) {
      throw e;
    }
    return ret;
  }
}
