import express from 'express';

export default async function express_contents(app, main, settings) {
  const contents = express();
  const router = express.Router();
  contents.use((req, res, next) => {
    if (req.session && req.session.user) {
      // ユーザーが認証されている場合の処理
      next();
    }
    if (!req.session){
      res.status(403).send('Sorry, this page requires authentication.');
      return;
    }
    req.session.returnTo = req.originalUrl; // 認証後にリダイレクトするURLを保存
    res.redirect(settings.config.app.urlBase + '/auth/login');
  });

  contents.use('/', router)

  return contents;
}
