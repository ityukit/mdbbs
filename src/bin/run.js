import { fileURLToPath } from 'node:url';
import util from 'node:util';

import init from '../init.js';
import loggerGenerator from '../logger.js';
import database from '../database.js';
import contentManager from '../lib/contentManager.js';

const __filename = fileURLToPath(import.meta.url);

const settings = init();
const logger = loggerGenerator(settings);

logger.trace('trace message');
logger.debug('debug message');
logger.info('info message');
logger.warn('warn message');
logger.error('error message');
logger.fatal('fatal message');

/* eslint-disable import/first */
import example from '../lib/example.js';
import UserManager from '../lib/userManager.js';
/* eslint-enable import/first */

console.log(util.inspect(settings, { showHidden: true, depth: null, colors: true }));
example(settings);
const users = new UserManager(settings, database);
//console.log(util.inspect(await users.getUserById(2), { showHidden: true, depth: null, colors: true }));
const content = new contentManager(settings, database);
console.log(await content.getContentById(1));
database.destroy();
