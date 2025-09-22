 
import database from '../../../database.js';
import init from '../../../init.js';
import cacheUser from '../../../lib/cacheUser.js';

const settings = init.getSettings();

async function usermapping(uid,db){
  const user = await cacheUser.getUserById(uid, db);
  if (!user) return null;
  return {
    id: user.id,
    // login_id: user.login_id,
    display_name: user.display_name,
    email: user.email,
    description: user.description,
    created_at: user.created_at,
    created_at_str: settings.datetool.format(new Date(user.created_at)),
  }
}

async function contents_info(contentsId, req, res, tx) {
 const data = await tx.select('title', 'revision','contents', 'parser', 'description','created_user_id', 'updated_user_id', 'created_at', 'updated_at')
                      .from('contents')
                      .where({ id: contentsId });
  if (data.length === 0) {
    return res.status(404).json({ error: 'Contents not found' });
  }
  return res.json({
    contentsId: contentsId,
    title: data[0].title,
    revision: data[0].revision,
    contents: data[0].contents,
    parser: data[0].parser,
    description: data[0].description,
    created_user: await usermapping(data[0].created_user_id, tx),
    updated_user: await usermapping(data[0].updated_user_id, tx),
    updated_at: data[0].updated_at.toISOString(),
    updated_at_str: settings.datetool.format(data[0].updated_at),
    created_at: data[0].created_at.toISOString(),
    created_at_str: settings.datetool.format(data[0].created_at),
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/info', async (req, res) => {
    const contentsId = req.query?.contentsId;

    if (contentsId == undefined || contentsId == null || contentsId === '') {
      return res.status(400).json({ error: 'contentsId is required' });
    }

    let data = await database.transaction(async (tx) => {
          return await contents_info(contentsId, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
