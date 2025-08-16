import express from 'express';
export default async function login(app, main, api, subdir, moduleName, settings) {
  const login = express();

  // ログイン処理
  login.post('/auth/login', async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
      // ユーザー認証のロジックをここに実装
      const user = {id:0, loginId: 'testuser', name: 'testuserName'}
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // セッションにユーザー情報を保存
      req.session.user = user;

      res.json({
        message: 'Login successful',
        user,
        redirectTo: req.session.redirectTo || settings.config.app.urlBase,
      });
      req.session.redirectTo = null;
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return login;
}