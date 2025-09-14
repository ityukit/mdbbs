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

async function get_index(node, tags, nodeWord, subTree, start, len, db) {
  let data = [];

  let tx = null;
  let dir_id = -1;
  if (node !== ''){
    const chk = await db.select('id').from('dirs').where({ dir_id: node });
    if (chk.length === 0) {
      // not found
      return { count: 0 };
    }
    dir_id = chk[0].id;
  }
  const addRoot = dir_id === -1 ? true : false;
  if (subTree){
    // get subtree ids
    tx = db.queryBuilder().withRecursive('t_child_list', (qb) => {
      let d = qb.select('id','child_id','parent_id').from('dirtree').where('child_id', dir_id);
      if (addRoot) {
        d = d.unionAll((qb) => {
          qb.select(db.raw('-1 as id,-1 as child_id,-2 as parent_id'))
        })
      }
      d = d.unionAll((qb) => {
          qb.select('dirtree.id','dirtree.child_id','dirtree.parent_id').from('dirtree')
            .join('t_child_list', 'dirtree.parent_id', '=', 't_child_list.child_id')
        });
    })
  }else{
    tx = db.queryBuilder().with('t_child_list', (qb) => {
      let d = qb.select('id','child_id','parent_id').from('dirtree').where('child_id', dir_id);
      if (addRoot) {
        d = d.unionAll((qb) => {
          qb.select(db.raw('-1 as id,-1 as child_id,-2 as parent_id'))
        })
      }
    })
  }

  tx = tx.select(
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
                  db.raw('u_dir_ids(t_child_list.child_id) as dir_ids'),
                  db.raw('u_dir_names(t_child_list.child_id) as dir_names'),
                  db.raw('u_tag_ids(threads.id) as tag_ids'),
                  db.raw('u_tag_names(threads.id) as tag_names')
                )
               .from('t_child_list')
               .join('threads', 't_child_list.id', '=', 'threads.dirtree_id')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .where('threads.visibled', true)
               .orderBy('threads.first_sort_key', 'asc')
               .orderBy('threads.second_sort_key', 'asc')
               .orderBy('updated_at', 'desc')
               .orderBy('id', 'desc')
               .limit(len)
               .offset(start);
  if (tags.length > 0) {
    tx = tx.join(
            db.select('map_thread_tag.thread_id as thread_id')
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
  if (nodeWord !== '') {
    nodeWord = nodeWord.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    tx = tx
          .join('dirs', 't_child_list.child_id', '=', 'dirs.id')
          .where('dirs.display_name', 'like', `%${nodeWord}%`)
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
        contents: (await parser.parse(d.parser, d.contents, d.cid)).main,
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
    let node = req.query.node || '';
    const tagsStr = req.query.tags || '';
    const tags = tagsStr !== '' ? tagsStr.split('+').map(id => decodeURIComponent(id)) : [];
    const startStr = req.query.start || '0';
    const lenStr = req.query.len || '50';
    const nodeWord = req.query.nodeWord || '';
    const subTree = req.query.subTree === '1';
    let start = utils.parseSafeInt(startStr, 0);
    let len = utils.parseSafeInt(lenStr, 50);
    if (start < 0) start = 0;
    if (len < 1) len = 1;
    // safety
    if (len > 1000) len = 1000;
    let data = await database.transaction(async (tx) => {
      return await get_index(node, tags, nodeWord, subTree, start, len, tx);
    });
    res.json(data);
  });

  return null;
}
