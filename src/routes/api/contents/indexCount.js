import { ta } from 'date-fns/locale';
import database from '../../../database.js';

async function get_indexCount(node, nodeWord, tags, subTree, db) {

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


  tx = tx.count('threads.thread_id as cnt')
               .from('t_child_list')
               .join('threads', 't_child_list.id', '=', 'threads.dirtree_id')
               .join('contents', 'threads.contents_id', '=', 'contents.id')
               .join('dirtree', 'threads.dirtree_id', '=', 'dirtree.id')
                .where('contents.visibled', true)
  if (tags.length > 0) {
    tx = tx
          .join(
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
          .join('dirs', 'dirtree.child_id', '=', 'dirs.id')
          .where('dirs.display_name', 'like', `%${nodeWord}%`)
  }
  data = await tx.first();
  return {
    count: data.cnt
  };
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/indexCount', async (req, res) => {
    let node = req.query.node || '';
    const tagsStr = req.query.tags || '';
    const tags = tagsStr !== '' ? tagsStr.split('+').map(id => decodeURIComponent(id)) : [];
    const nodeWord = req.query.nodeWord || '';
    const subTree = req.query.subTree === '1';
    let data = await database.transaction(async (tx) => {
      return await get_indexCount(node, nodeWord, tags, subTree, tx);
    });
    res.json(data);
  });

  return null;
}
