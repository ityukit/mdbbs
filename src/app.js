import { fileURLToPath } from 'node:url';
import util from 'node:util';

import init from './init.js';
import loggerGenerator from './logger.js';
import database from './database.js';
import cache from './cache.js';


import express from 'express';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import * as sessionRedis from 'connect-redis';
import S3rver from 's3rver';
import redisCache from './cache/redis.js';

import express_api from './routes/api.js'
import express_auth from './routes/auth.js';
import express_contents from './routes/contents.js';
import express_meta from './routes/meta.js';
import { se } from 'date-fns/locale';

const __filename = fileURLToPath(import.meta.url);

const settings = init.getSettings();
const logger = loggerGenerator(settings);

const app = express();
const main = express();

// log
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
// res-header
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'MDBBS');
  next();
});
// error handling
app.use((err, req, res, next) => {
  logger.error(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${err.message}`);
  res.status(500).send('Internal Server Error');
});

// session
main.use(
  session({
    secret: settings.config.session.secret,
    name: 'SESSION_ID',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * settings.config.session.maxAge, // msec
      secure: false, // true if using https
      httpOnly: true,
    },
    store: (()=>{
      if (settings.config.session.type === 'file-store') {
        const FileStore = sessionFileStore(session);
        return new FileStore({
          path: settings.config.sessionFileStore.directory,
          ttl: settings.config.session.maxAge, // in seconds
        });
      } else if (settings.config.session.type === 'redis') {
        return new sessionRedis.RedisStore({
          client: (new redisCache(settings, __filename)).createNewClientInstance(),
          prefix: 'sess:',
          ttl: settings.config.session.maxAge, // in seconds
        });
      }
    })(),
  })
)

const auth = express_auth(app,main,settings);
const contents = express_contents(app,main,settings);
const meta = express_meta(app,main,settings);
const api = express_api(app,main,settings);

// default setting
main.set('view engine', 'hbs');
main.use(express.static('public'));
// parser
main.use(express.json());
main.use(express.urlencoded({ extended: true }));

main.use('/api', api);
main.use('/auth', auth);
main.use('/contents', contents);
main.use('/meta', meta);
main.get('/', (req, res) => {
  res.redirect(settings.config.app.urlBase + '/contents');
});

app.use(settings.config.app.urlBase, main);
app.get('/', (req, res) => {
  console.log("AAA")
  res.redirect(settings.config.app.urlBase);
});

app.use((req, res, next) => {
  res.status(404).send('Sorry, the page you are looking for does not exist!');
});

let s3rver = null;
if (settings.config.s3.server.enabled) {
  s3rver = new S3rver({
    address: settings.config.s3.server.address,
    port: settings.config.s3.server.port,
    silent: settings.config.s3.server.silent,
    directory: settings.config.s3.server.directory,
    vhostBuckets: false,
  });
  s3rver.run((err, host, port) => {
    if (err) {
      logger.error(`S3 server failed to start: ${err.message}`);
      throw err;
    } else {
      logger.info(`S3 server started at ${settings.config.s3.server.address}:${settings.config.s3.server.port}`);
    }
  });
}

var server = app.listen(settings.config.app.port, function(){
    logger.info("MDBBS is listening to PORT:" + server.address().port);
});

process.on('SIGTERM', () => {
  // サーバをシャットダウンする
  if (s3rver) {
    s3rver.close(() => {
      logger.info('S3 server closed.');
    });
  }
  server.close(() => {
    // シャットダウン時の処理を実装する
    database.close();
    logger.info('SIGTERM signal received.');
  });
});
    
export default {
  app,
  main,
  settings,
  logger,
  database,
};
