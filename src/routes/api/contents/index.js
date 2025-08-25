import utils from '../../../lib/utils.js';
import parser from '../../../lib/parser.js';
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

async function get_index(node, tags, start, len, db) {
  let data = [];
  let tx = db.select(
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
                  database.raw('u_dir_ids(dirtree.child_id) as dir_ids'),
                  database.raw('u_dir_names(dirtree.child_id) as dir_names'),
                  database.raw('u_tag_ids(threads.id) as tag_ids'),
                  database.raw('u_tag_names(threads.id) as tag_names')
                )
               .from('threads')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .join('dirtree', 'threads.dirtree_id', '=', 'dirtree.id')
               .orderBy('updated_at', 'desc')
               .orderBy('id', 'desc')
               .limit(len)
               .offset(start);
  if (node === ''){
    // 全ノード対象
    if (tags.length === 0) {
      // タグが指定されていない場合
      // DO NOTHING
    } else {
      // タグが指定されている場合
      tx = tx
            .join(
              database.select('map_thread_tag.thread_id as thread_id')
                  .from('map_thread_tag')
                  .join('tags', 'map_thread_tag.tag_id', '=', 'tags.id')
                  .whereIn('tags.tag_id', tags)
                  .groupBy('map_thread_tag.thread_id')
                  .havingRaw('count(tags.id) = ?', [tags.length])
                  .clone()
                  .as('filtered_threads'),
              'threads.id','=', 'filtered_threads.thread_id'
            )
    }
  }else{
    // 指定のノード対象
    tx = tx
          .join('dirs', 'dirtree.child_id', '=', 'dirs.id')
          .where('dirs.dir_id', node)
    if (tags.length === 0) {
      // DO NOTHING
    }else{
      tx = tx
            .join(
              database.select('map_thread_tag.thread_id as thread_id')
                  .from('map_thread_tag')
                  .join('tags', 'map_thread_tag.tag_id', '=', 'tags.id')
                  .whereIn('tags.tag_id', tags)
                  .groupBy('map_thread_tag.thread_id')
                  .havingRaw('count(tags.id) = ?', [tags.length])
                  .clone()
                  .as('filtered_threads'),
              'threads.id','=', 'filtered_threads.thread_id'
            )
    }
  }
  data = await tx;
  // formatting
  let rdata = []
  for (const d of data) {
    if (!d.visibled) continue;
    if (d.locked) continue;
    if (!d.enabled) continue;
    rdata.push({
      id: d.id,
      title: d.title,
      contents: {
        id: d.cid,
        title: d.ctitle,
        contents: (await parser.parse(d.parser, d.contents)).value,
        description: d.description,
        updated_user: await usermapping(d.updated_user_id, db),
        created_user: await usermapping(d.created_user_id, db),
        updated_at: d.updated_at.toISOString(),
        updated_at_str: settings.datetool.format(d.updated_at),
        created_at: d.created_at.toISOString(),
        created_at_str: settings.datetool.format(d.created_at),
        dir_ids: d.dir_ids?d.dir_ids.split(' > '):[],
        dir_names: d.dir_names?d.dir_names.split(' > '):[],
        tag_ids: d.tag_ids?d.tag_ids.split(' > '):[],
        tag_names: d.tag_names?d.tag_names.split(' > '):[],
      }
    });

  }
  return rdata;
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/index', async (req, res) => {
    const node = req.query.node || '';
    const tagsStr = req.query.tags || '';
    const tags = tagsStr !== '' ? tagsStr.split('+').map(id => decodeURIComponent(id)) : [];
    const startStr = req.query.start || '0';
    const lenStr = req.query.len || '50';
    let start = utils.parseSafeInt(startStr, 0);
    let len = utils.parseSafeInt(lenStr, 50);
    if (start < 0) start = 0;
    if (len < 1) len = 1;
    // safety
    if (len > 1000) len = 1000;
    let data = await database.transaction(async (tx) => {
      return await get_index(node, tags, start, len, tx);
    });
    res.json(data);
  });

  return null;
}
