import express from 'express';
export default async function login(app, main, api, subdir, moduleName, settings) {
  const login = express();

  // ログアウト処理
  login.post('/auth/logout', async (req, res) => {
    req.session.user = null; // セッションからユーザー情報を削除
    res.json({ message: 'Logout successful', redirectTo: settings.config.app.urlBase });
  });

  return login;
}