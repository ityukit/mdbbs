import { fileURLToPath } from 'node:url';
import util from 'node:util';
import crypto from 'crypto'; 

import init from './init.js';
import loggerGenerator from './logger.js';
import database from './database.js';
import cache from './cache.js';


import express from 'express';
import session from 'express-session';
import sessionFileStore from 'session-file-store';
import {RedisStore} from 'connect-redis';
import hbs from 'hbs'
import S3rver from 's3rver';
import redisCache from './cache/redis.js';

import express_api from './routes/api.js'
import express_auth from './routes/auth.js';
import express_contents from './routes/contents.js';
import express_meta from './routes/meta.js';
import express_account from './routes/account.js';
import setting from './lib/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));

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
// parser
main.use(express.json());
main.use(express.urlencoded({ extended: true }));
// session
const redisstore = await (new redisCache(settings, __filename)).createNewClientInstance();
if (settings.config.session.type === 'redis'){
  redisstore.connect().catch((err) => {
    logger.error(`Redis Client Connect Error: ${err.toString()}`);
    process.exit(1);
  });
}
main.use(
  session({
    secret: settings.config.session.secret,
    name: 'SESSION_ID',
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: settings.config.app.urlBase || "/",
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
        return new RedisStore({
          client: redisstore,
          prefix: 'sess:',
          ttl: settings.config.session.maxAge, // in seconds
        });
      }
    })(),
  })
)
main.use((req, res, next) => {
  if (!req.session) {
    return res.status(401).send('cannot access this page without session');
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = {
      id: crypto.randomBytes(16).toString('hex'),
      lastId: crypto.randomBytes(16).toString('hex'),
      createdAt: Date.now(),
    };
  }
  if (req.session.csrfToken.createdAt < Date.now() - 3600000) { // 1 hour
    const currentId = req.session.csrfToken.id;
    req.session.csrfToken = {
      id: crypto.randomBytes(16).toString('hex'),
      lastId: currentId,
      createdAt: Date.now(),
    };
  }
  next();
});
main.use((req, res, next) => {
  if (req.method === 'POST') {
    // CSRF対策
    // /api/auth/loginだけはCSRFトークンをチェックしない
    if (req.path === '/api/auth/login') {
      return next();
    }
    const token = req.body?._csrf;
    if (token && (token === req.session.csrfToken.id || token === req.session.csrfToken.lastId)) {
      return next();
    }
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
});
main.use(settings.i18n.init);
main.use(function (req, res, next) {
  if (req.session.locale) {
    settings.i18n.setLocale(req, req.session.locale);
  }
  if (req.query?.lang) {
    settings.i18n.setLocale(req, req.query.lang);
  }
  next();
});

const auth = await express_auth(app,main,settings);
const contents = await express_contents(app,main,settings);
const meta = await express_meta(app,main,settings);
const api = await express_api(app,main,settings);
const account = await express_account(app,main,settings);

// default setting
hbs.registerPartials(__dirname + '/views', function (err) {});
main.set('view engine', 'hbs');
main.set('views', __dirname + '/views');
auth.set('view engine', 'hbs');
auth.set('views', __dirname + '/views');
contents.set('view engine', 'hbs');
contents.set('views', __dirname + '/views');
meta.set('view engine', 'hbs');
meta.set('views', __dirname + '/views');
account.set('view engine', 'hbs');
account.set('views', __dirname + '/views');
main.use('/public',express.static('src/public'));

main.use('/api', api);
main.use('/auth', auth);
main.use('/contents', contents);
main.use('/meta', meta);
main.use('/account', account);
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
    logger.info("MDBBS is listening to PORT:" + settings.config.app.port);
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
    database.destroy();
    logger.info('SIGTERM signal received.');
  });
  redisstore.destroy();
  setTimeout(() => {
    logger.warn('Forcing shutdown after 10 seconds.');
    process.exit(1);
  }, 10000);
});
    
export default {
  app,
  main,
  settings,
  logger,
  database,
};
