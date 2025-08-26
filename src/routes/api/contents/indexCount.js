import database from '../../../database.js';

async function get_indexCount(node, nodeWord, tags, db) {

  let data = [];
  let tx = db.count(
                  'threads.thread_id as cnt',
                )
               .from('threads')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .join('dirtree', 'threads.dirtree_id', '=', 'dirtree.id')
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
    if (nodeWord !== '') {
      nodeWord = nodeWord.replace(/%/g, '\\%').replace(/_/g, '\\_');
      tx = tx
            .join('dirs', 'dirtree.child_id', '=', 'dirs.id')
            .where('dirs.display_name', 'like', `%${nodeWord}%`)
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
    // nodeWordは無視
  }
  data = await tx.first();
  return {
    count: data.cnt
  }
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/indexCount', async (req, res) => {
    let node = req.query.node || '';
    const tagsStr = req.query.tags || '';
    const tags = tagsStr !== '' ? tagsStr.split('+').map(id => decodeURIComponent(id)) : [];
    const nodeWord = req.query.nodeWord || '';
    let data = await database.transaction(async (tx) => {
      return await get_indexCount(node, nodeWord, tags, tx);
    });
    res.json(data);
  });

  return null;
}
