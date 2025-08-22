import express from 'express';
import dynamicLoader from '../lib/dynamicLoader.js';

export default async function express_api(app, main, settings) {
  const api = express();
  api.use((req, res, next) => {
    if (!req.session){
      res.status(403).send('Sorry, this page requires authentication.');
      return;
    }
    if (req.session && req.session.user) {
      // ユーザーが認証されている場合の処理
      next();
      return;
    }
    // auth/loginのみは認証なしでアクセス可能
    if (req.method === 'POST' && req.path === '/auth/login') {
      next();
      return;
    }
    req.session.returnTo = req.originalUrl; // 認証後にリダイレクトするURLを保存
    res.redirect(settings.config.app.urlBase + '/auth/login');
  });

  await dynamicLoader('./src/routes/api', async (subdir,moduleName,module) => {
    const def = await module.default(app, main, api, subdir, moduleName, settings);
    if (def) api.use(def);
  });
  return api;
}
