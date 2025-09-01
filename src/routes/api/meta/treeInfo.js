 
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

async function tree_info(dir_id, req, res, tx) {
 const data = await tx.select('display_name', 'description', 'created_user_id', 'updated_user_id', 'created_at', 'updated_at')
                      .from('dirs')
                      .where({ dir_id: dir_id });
  if (data.length === 0) {
    return res.status(404).json({ error: 'Directory not found' });
  }
  return res.json({
    dir_id: dir_id,
    display_name: data[0].display_name,
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
  api.get('/meta/treeInfo', async (req, res) => {
    const dir_id = req.query?.dir_id;

    if (dir_id == undefined || dir_id == null || dir_id === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    let data = await database.transaction(async (tx) => {
          return await tree_info(dir_id, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
