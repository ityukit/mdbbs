import phash from '../../../lib/phash.js';
import _ from 'lodash';
import database from '../../../database.js';
import cacheUser from '../../../lib/cacheUser.js';
import init from '../../../init.js';

const pHash = new phash(init.getSettings());
const passwordNone = await pHash.hashPassword('');

export default async function login(app, main, api, subdir, moduleName, settings) {
  // ログイン処理
  api.post('/auth/login', async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;
    if (!username || !password) {
      return res.json({ error: 'requireUserPassword' });
    }

    try {
      const pHash = new phash(settings);
      const user = await database.transaction(async (tx) => {
        const user = await tx.select('id','login_id','hashed_password','enabled','locked').where({ login_id: username }).from('users').first();
        if (!user || user.hashed_password === null) {
          // dummy run
          await pHash.verifyPassword('', passwordNone);
          // error
          res.json({ error: 'failUserPassword' });
          return null;
        }
        if (!(await pHash.verifyPassword(password, user.hashed_password))) {
          // error
          res.json({ error: 'failUserPassword' });
          return null;
        }
        // user and password ok
        if (!user.enabled){
          res.json({ error: 'userDisabled' });
          return null;
        }
        if (user.locked) {
          res.json({ error: 'userLocked' });
          return null;
        }
        // user login ok!
        return await cacheUser.getUserById(user.id);
      });
      if (!user) {
        return;
      }

      // セッションにユーザー情報を保存
      req.session.user = user;
      res.json({
        message: 'Login successful',
        redirectTo: req.session.redirectTo || settings.config.app.urlBase,
      });
      req.session.redirectTo = null;
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return null;
}