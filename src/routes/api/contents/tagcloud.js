import database from '../../../database.js';

async function get_tags(id, nodeWord, db) {
  let tags = null;
  let tx = null;
  if (id === ''){
    tx = db.select('tags.tag_id', 'tags.display_name').count('tags.tag_id as cnt')
                   .from('map_thread_tag').join('tags', 'map_thread_tag.tag_id', '=', 'tags.id')
                   .groupBy(['tags.tag_id','tags.display_name'])
                   .orderBy('cnt', 'desc')
                   .orderBy('tags.tag_id', 'asc')
                   .limit(50);
    if (nodeWord){
      tx = tx.where('tags.display_name', 'like', `%${nodeWord}%`)
    }
  }else{
    tx = db.select('tags.tag_id', 'tags.display_name').count('tags.tag_id as cnt')
                   .from('dirs')
                   .join('dirtree', 'dirs.id', '=', 'dirtree.child_id')
                   .join('threads', 'dirtree.id', '=', 'threads.dirtree_id')
                   .join('map_thread_tag', 'threads.id', '=', 'map_thread_tag.thread_id')
                   .join('tags', 'map_thread_tag.tag_id', '=', 'tags.id')
                   .where('dirs.dir_id', id)
                   .groupBy(['tags.tag_id', 'tags.display_name'])
                   .orderBy('cnt', 'desc')
                   .orderBy('tags.tag_id', 'asc')
                   .limit(50);
    // nodeWordは無視
  }
  tags = await tx;
  return tags.map(tag => {
    return {
      tag_id: tag.tag_id,
      display_name: tag.display_name,
      count: tag.cnt
    };
  });
}

export default async function tagcloud(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/tagcloud', async (req, res) => {
    let root = req.query.treeId || '';
    const nodeWord = req.query.nodeWord || '';
    const tags = await database.transaction(async (tx) => {
      return await get_tags(root, nodeWord, tx);
    });
    res.json(tags);
  });

  return null;
}