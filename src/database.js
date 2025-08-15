import Knex from 'knex';
import pg from 'pg';
import init from './init.js';

pg.types.setTypeParser(20, 'text', (a) => {
  const i = parseInt(a, 10);
  return Number.isSafeInteger(i) ? i : NaN;
});

const settings = init.getSettings();
const database = Knex(settings.config[settings.config.database.type]);

export default database;
