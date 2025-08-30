export default async function login(app, main, meta, subdir, moduleName, settings) {
  // 言語設定処理
  meta.post('/setLang', async (req, res) => {
    const lang = req.body?.lang;
    if (lang) {
      if (settings.i18n.getLocales().includes(lang)) {
        req.session.locale = lang;
        res.json({ message: 'Language changed successfully' });
      } else {
        res.status(400).json({ message: 'Invalid language' });
      }
    } else {
      delete req.session.locale;
      res.json({ message: 'Language changed successfully' });
    }
  });

  return null;
}