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
    return this.client.get(this.prefix + key);
  }
  async set(key, value) {
    return this.client.set(this.prefix + key, value);
  }
  async del(key) {
    return this.client.del(this.prefix + key);
  }
  async exists(key) {
    return this.client.exists(this.prefix + key);
  }
  async keys(pattern) {
    return this.client.keys(this.prefix + pattern);
  }
  async hgetall(key) {
    return this.client.hGetAll(this.prefix + key);
  }
  async hset(key, field, value) {
    return this.client.hSet(this.prefix + key, field, value);
  }
  async hdel(key, field) {
    return this.client.hDel(this.prefix + key, field);
  }
  async hget(key, field) {
    return this.client.hGet(this.prefix + key, field);
  }
  async hkeys(key) {
    return this.client.hKeys(this.prefix + key);
  }
  async hvals(key) {
    return this.client.hVals(this.prefix + key);
  }
  async expire(key, seconds) {
    return this.client.expire(this.prefix + key, seconds);
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
  }

  createNewClientInstance() {
    const client = createClient(this.clientOption);
    client.on('error', (err) => this.logger.Error(`Redis Client Error: ${err.toString()}`));
    return client;
  }

  async run(callback) {
    this.logger.trace('in run');

    let ret = null;
    let client = null;
    try {
      client = await createClient(this.clientOption).on('error', (err) =>
        this.logger.Error(`Redis Client Error: ${err.toString()}`),
      );
      await client.connect();
      try {
        ret = await callback(new RedisClientWrapper(client, this.prefix));
      } catch (e) {
        await client.disconnect();
        throw e;
      }
      await client.disconnect();
      // await client.quit();
      client = null;
    } catch (e) {
      if (client !== null) {
        try {
          // await client.quit();
        } catch (e2) {
          // DO NOTHING
        }
      }
      throw e;
    }
    return ret;
  }
}
