import viewHelper from "../../lib/viewHelper.js";

export default async function logout(app, main, auth, subdir, moduleName, settings) {
  auth.get('/logout', async (req, res) => {
    if (!req.session.user) {
      return res.redirect(settings.config.app.urlBase);
    }
    res.render('auth/logout', viewHelper.getParameter({
      noindex: true,
    }, req, settings, 'auth.logout'));
  });
  return null;
}
