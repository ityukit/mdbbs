import { fileURLToPath } from 'node:url';
import { createClient } from 'redis';
import loggerGenerator, {moduleFilepathGenerator,moduleNameGenerator} from '../logger.js';

const __filename = fileURLToPath(import.meta.url);

class RedisClientWrapper {
  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }
  async get(key) {
    return await this.client.get(this.prefix + key);
  }
  async set(key, value) {
    return await this.client.set(this.prefix + key, value);
  }
  async del(key) {
    return await this.client.del(this.prefix + key);
  }
  async exists(key) {
    return await this.client.exists(this.prefix + key);
  }
  async keys(pattern) {
    return await this.client.keys(this.prefix + pattern);
  }
  async delDirectKeys(keys) {
    if (keys.length > 0) {
      return await this.client.del(keys);
    }
    return 0;
  }
  async hgetall(key) {
    return await this.client.hGetAll(this.prefix + key);
  }
  async hset(key, field, value) {
    return await this.client.hSet(this.prefix + key, field, value);
  }
  async hdel(key, field) {
    return await this.client.hDel(this.prefix + key, field);
  }
  async hget(key, field) {
    return await this.client.hGet(this.prefix + key, field);
  }
  async hkeys(key) {
    return await this.client.hKeys(this.prefix + key);
  }
  async hvals(key) {
    return await this.client.hVals(this.prefix + key);
  }
  async expire(key, seconds) {
    return await this.client.expire(this.prefix + key, seconds);
  }
  async clearAll() {
    const keys = await this.client.keys(this.prefix + '*');
    if (keys.length > 0) {
      return await this.client.del(keys);
    }
    return 0;
  }
}

export default class Redis {
  constructor(setting, filepath) {
    this.setting = setting;
    this.logger = loggerGenerator(setting);
    this.clientOption = {
      socket: {
        port: setting.config.redis.port,
        host: setting.config.redis.host,
      },
      database: setting.config.redis.db,
    };
    if (setting.config.redis.password !== undefined) {
      this.clientOption.password = setting.config.redis.password;
    }
    this.base_prefix = '';
    if (setting.config.redis.prefix !== undefined && setting.config.redis.prefix !== null) {
      this.base_prefix = setting.config.redis.prefix;
      this.base_prefix += ':';
    }
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
    this.client = null;
    this.clientWrapper = null;
  }

  async createNewClientInstance() {
    const client = await createClient(this.clientOption);
    client.on('error', (err) => this.logger.Error(`Redis Client Error: ${err.toString()}`));
    return client;
  }

  async disconnect() {
    this.logger.trace('in disconnect');
    if (this.client !== null) {
      try {
        const client = this.client;
        this.client = null;
        this.clientWrapper = null;
        await client.destroy();
      } catch (e) {
        throw e;
      }
    }
  }

  async run(callback) {
    this.logger.trace('in run');

    let ret = null;
    try {
      if (this.client === null) {
        const client = await this.createNewClientInstance();
        await client.connect();
        this.client = client;
        this.clientWrapper = null;
      }
      if (this.clientWrapper === null) {
        this.clientWrapper = new RedisClientWrapper(this.client, this.prefix);
      }
      try {
        ret = await callback(this.clientWrapper);
      } catch (e) {
        const client = this.client;
        this.client = null;
        this.clientWrapper = null;
        await client.destroy();
        throw e;
      }
    } catch (e) {
      if (this.client !== null) {
        try {
          const client = this.client;
          this.client = null;
          this.clientWrapper = null;
          await client.destroy();
        } catch (e2) {
          // DO NOTHING
        }
      }
      throw e;
    }
    return ret;
  }
}
