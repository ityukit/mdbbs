import process from 'process';
import * as dotenv from 'dotenv';
import fs from 'fs';
import YAML from 'yaml';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import settings from './settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let env = 'production';
if (process.env.NODE_ENV) {
  env = process.env.NODE_ENV;
}

export default function init() {
  let home = path.resolve(__dirname, '../');
  if (!home.endsWith('/')) {
    home += '/';
  }
  process.env.ROOT_DIR = home;
  if (fs.existsSync(`${home}/.env/${env}`)) {
    dotenv.config({ path: `${home}/.env/${env}` });
  }

  let defaultconfigdata = {};
  if (fs.existsSync(`${home}/src/default/config/${env}.yaml`)) {
    const defaultconfigfile = fs.readFileSync(`${home}/src/default/config/${env}.yaml`, 'utf8');
    defaultconfigdata = YAML.parse(defaultconfigfile);
  }

  let configdata = {};
  if (fs.existsSync(`${home}/.config/${env}.yaml`)) {
    const configfile = fs.readFileSync(`${home}/.config/${env}.yaml`, 'utf8');
    configdata = YAML.parse(configfile);
  }

  return settings(env, home, defaultconfigdata, configdata);
}
