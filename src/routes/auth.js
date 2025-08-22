import express from 'express';
import dynamicLoader from '../lib/dynamicLoader.js';

export default async function express_auth(app, main, settings) {
  const auth = express();
  auth.use((req, res, next) => {
    if (!req.session){
      res.status(403).send('Sorry, this page requires authentication.');
      return;
    }
    if (req.session && req.session.user) {
      // ユーザーが認証されている場合の処理
      next();
      return;
    }
    // loginのみは認証なしでアクセス可能
    if (req.method === 'GET' && req.path === '/login') {
      next();
      return;
    }
    req.session.returnTo = req.originalUrl; // 認証後にリダイレクトするURLを保存
    res.redirect(settings.config.app.urlBase + '/auth/login');
  });

  await dynamicLoader('./src/routes/auth', async (subdir,moduleName,module) => {
    const def = await module.default(app, main, auth, subdir, moduleName, settings);
    if (def) auth.use(def);
  });
  return auth;
}
