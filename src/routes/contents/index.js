import viewHelper from "../../lib/viewHelper.js";

export default async function index(app, main, contents, subdir, moduleName, settings) {
  contents.get('/', async (req, res) => {
    res.render('contents/index', viewHelper.getParameter({
    }, req, settings, 'contents.index'));
  });
  return null;
}
