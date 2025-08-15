import express from 'express';
export default async function csrfToken(app, main, api, subdir, moduleName, settings) {
  const csrf = express();

  // CSRFトークン取得処理
  csrf.post('/auth/csrfToken', async (req, res) => {
    if (!req.session.csrfToken) {
      return res.status(500).json({ error: 'CSRF token not found' });
    }
    res.json({ csrfToken: req.session.csrfToken.id });
  });

  return csrf;
}