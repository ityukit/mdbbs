import express from 'express';
import dynamicLoader from '../lib/dynamicLoader.js';

export default async function express_contents(app, main, settings) {
  const contents = express();
  contents.use((req, res, next) => {
    if (!req.session){
      res.status(403).send('Sorry, this page requires authentication.');
      return;
    }
    if (req.session && req.session.user) {
      // ユーザーが認証されている場合の処理
      next();
      return;
    }
    req.session.returnTo = req.originalUrl; // 認証後にリダイレクトするURLを保存
    res.redirect(settings.config.app.urlBase + '/auth/login');
  });

  await dynamicLoader('./src/routes/contents', async (subdir,moduleName,module) => {
    const def = await module.default(app, main, contents, subdir, moduleName, settings);
    if (def) contents.use(def);
  });

  return contents;
}
