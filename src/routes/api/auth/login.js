import phash from '../../../lib/phash.js';
import _ from 'lodash';
import database from '../../../database.js';
import cache from '../../../cache.js';
import init from '../../../init.js';

const pHash = new phash(init.getSettings());
const passwordNone = pHash.hashPassword('');

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
        const user = await tx.select('id','login_id','hashed_password','display_name','enabled','locked').where({ login_id: username }).from('users').first();
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
        return user;
      });
      if (!user) {
        return;
      }

      // セッションにユーザー情報を保存
      req.session.user = {
        id: user.id,
        loginId: user.login_id,
        name: user.display_name,
      };
      // キャッシュにユーザー情報を保存
      await cache.run(async (client)=>{
        await client.set(`user:${user.id}`, _.cloneDeep(req.session.user));
      });

      res.json({
        message: 'Login successful',
        user: req.session.user,
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