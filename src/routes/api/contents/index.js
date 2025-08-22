import utils from '../../../lib/utils.js';

async function get_index(node, tags, start, len, db) {
  let data = [];
  if (node === ''){
    // 全ノード対象
    if (tags.length === 0) {
      // タグが指定されていない場合
      data = await db
               .select(
                  'threads.id as id',
                  'threads.title as title',
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
                  'u_dir_ids(dirtree.parent_id) as dir_ids',
                  'u_dir_names(dirtree.parent_id) as dir_names',
                )
               .from('threads')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .join('dirtree', 'threads.dirtree_id', '=', 'dirtree.id')
               .orderBy('updated_at','id')
               .limit(len)
               .offset(start)
               .all()
    } else {
      // タグが指定されている場合

    }
  }else{
  }
  // formatting
  let rdata = []
  return rdata;
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/index', async (req, res) => {
    const node = req.query.node || '';
    const tagsStr = req.query.tags || '';
    const tags = tagsStr.split('+').map(id => decodeURIComponent(id));
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
