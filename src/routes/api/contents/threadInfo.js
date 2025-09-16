import cacheUser from '../../../lib/cacheUser.js';
import database from '../../../database.js';
import init from '../../../init.js';

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

async function get_threadInfo(targetId, db) {
  const chk = await db.select('id').from('threads').where({ thread_id: targetId });
  if (chk.length === 0) {
    // not found
    return { error: 'not found' };
  }
  const thread_id = chk[0].id;

  const data = await db.select(
                  'threads.thread_id as id',
                  'threads.title as title',
                  'threads.status as status',
                  'threads.created_user_id as thread_created_user_id',
                  'threads.updated_user_id as thread_updated_user_id',
                  'threads.created_at as thread_created_at',
                  'threads.updated_at as thread_updated_at',
                  'threads.last_updated_at as thread_last_updated_at',
                  'contents.id as cid',
                  'contents.title as ctitle',
                  'contents.contents',
                  'contents.parser',
                  'contents.description',
                  'contents.visibled',
                  'contents.enabled',
                  'contents.locked',
                  'contents.updated_user_id',
                  'contents.created_user_id',
                  'contents.updated_at',
                  'contents.created_at',
                  db.raw('u_dir_ids(dirtree.child_id) as dir_ids'),
                  db.raw('u_dir_names(dirtree.child_id) as dir_names'),
                  db.raw('u_tag_ids(threads.id) as tag_ids'),
                  db.raw('u_tag_names(threads.id) as tag_names')
                )
               .from('threads')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .join('dirtree', 'threads.dirtree_id', '=', 'dirtree.id')
               .where('threads.id', thread_id)
               .where('contents.visibled', true)
               .limit(1);
  if (data.length === 0) {
    // not found
    return { error: 'not found' };
  }
  const d = data[0];
  if (!d) {
    return { error: 'not found' };
  }
  // formatting
  const dirs = [];
  const dir_ids = d.dir_ids?d.dir_ids.split(' > '):[];
  const dir_names = d.dir_names?d.dir_names.split(' > '):[];
  for(let i=0;i<dir_ids.length;i++){
    dirs.push({id: dir_ids[i], name: dir_names[i]});
  }
  const tags = [];
  const tag_ids = d.tag_ids?d.tag_ids.split(' > '):[];
  const tag_names = d.tag_names?d.tag_names.split(' > '):[];
  for(let i=0;i<tag_ids.length;i++){
    tags.push({id: tag_ids[i], name: tag_names[i]});
  }
  return {
      id: d.id,
      title: d.title,
      status: d.status,
      created_user: await usermapping(d.thread_created_user_id, db),
      updated_user: await usermapping(d.thread_updated_user_id, db),
      created_at: d.thread_created_at.toISOString(),
      created_at_str: settings.datetool.format(d.thread_created_at),
      updated_at: d.thread_updated_at.toISOString(),
      updated_at_str: settings.datetool.format(d.thread_updated_at),
      last_updated_at: d.thread_last_updated_at.toISOString(),
      last_updated_at_str: settings.datetool.format(d.thread_last_updated_at),
      dirs: dirs,
      tags: tags,
      contents: {
        id: d.cid,
        title: d.ctitle,
        contentsTitle: d.ctitle,
        contents: d.contents,
        parser: d.parser,
        description: d.description,
        updated_user: await usermapping(d.updated_user_id, db),
        created_user: await usermapping(d.created_user_id, db),
        updated_at: d.updated_at.toISOString(),
        updated_at_str: settings.datetool.format(d.updated_at),
        created_at: d.created_at.toISOString(),
        created_at_str: settings.datetool.format(d.created_at),
      },
  };
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/threadInfo', async (req, res) => {
    let targetId = req.query.targetId || '';
    if (targetId === undefined || targetId === null || targetId === '') {
      res.json({ error: 'no targetId' });
      return;
    }
    let data = await database.transaction(async (tx) => {
      return await get_threadInfo(targetId, tx);
    });
    res.json(data);
  });

  return null;
}
