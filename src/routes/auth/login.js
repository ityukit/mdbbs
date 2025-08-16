import viewHelper from "../../lib/viewHelper.js";

export default async function login(app, main, auth, subdir, moduleName, settings) {
  auth.get('/login', async (req, res) => {
    if (req.session.user) {
      return res.redirect(req.session.redirectTo || settings.config.app.urlBase);
    }
    res.render('auth/login', viewHelper.getParameter({
      noindex: true,
    }, req, settings, 'auth.login'));
  });
  return null;
}
