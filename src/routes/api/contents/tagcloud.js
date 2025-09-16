import { el } from 'date-fns/locale';
import database from '../../../database.js';

async function get_Alltags(nodeWord, maxCount, tagWord, db) {
  let tags = null;

  // Get all tags
  let tx = db.select('tags.tag_id', 'tags.display_name')
    .from('tags')
    .where('tags.display_name', 'like', `%${nodeWord}%`)
    .orWhere('tags.tag_id', 'like', `%${tagWord}%`)
    .limit(maxCount);
  if (nodeWord){
    nodeWord = nodeWord.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    tx = tx.where('dirs.display_name', 'like', `%${nodeWord}%`)
  }
  if (tagWord){
    tagWord = tagWord.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    tx = tx.where('tags.display_name', 'like', `%${tagWord}%`);
  }
  tags = await tx;

  return tags.map(tag => {
    return {
      tag_id: tag.tag_id,
      display_name: tag.display_name
    };
  });
}

async function get_tags(id, nodeWord, maxCount,tagWord,subTree, db) {
  let tags = null;
  let tx = null;
  let dir_id = -1;
  if (id !== ''){
    const chk = await db.select('id').from('dirs').where({ dir_id: id });
    if (chk.length === 0) {
      // not found
      return [];
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
  // t_child_list(dirtree).parent_id(dir_id)となる全タグ
  tx = tx.select('tags.tag_id', 'tags.display_name').count('tags.tag_id as cnt')
          .from('t_child_list')
          .join('threads', 't_child_list.id', '=', 'threads.dirtree_id')
          .join('map_thread_tag', 'threads.id', '=', 'map_thread_tag.thread_id')
          .join('tags', 'map_thread_tag.tag_id', '=', 'tags.id')
          .groupBy(['tags.tag_id', 'tags.display_name'])
          .orderBy('cnt', 'desc')
          .orderBy('tags.display_name', 'asc')
          .limit(maxCount);
  if (nodeWord){
    nodeWord = nodeWord.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    tx = tx.where('dirs.display_name', 'like', `%${nodeWord}%`)
  }
  if (tagWord){
    tagWord = tagWord.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    tx = tx.where('tags.display_name', 'like', `%${tagWord}%`);
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
    let maxCount = parseInt(req.query.maxCount || '50', 10);
    const tagWord = req.query.tagWord || '';
    const subTree = req.query.subTree === '1';
    const useGroup = req.query.useGroup === '1';
    if (Number.isNaN(maxCount) || maxCount < 1) {
      maxCount = 50;
    } else if (maxCount > 500) {
      maxCount = 500;
    }
    const tags = await database.transaction(async (tx) => {
      if (!useGroup) {
        return await get_tags(root, nodeWord, maxCount, tagWord, subTree, tx);
      } else {
        let ctags = [];
        if (root) ctags = await get_tags(root, nodeWord, maxCount, tagWord, subTree, tx);
        let rtags = await get_Alltags(nodeWord, maxCount, tagWord, tx);
        return [
          { text: req.__('page.contents.tagCloud.currentNode'), children: ctags },
          { text: req.__('page.contents.tagCloud.rootNode'), children: rtags }
        ];
      }
    });
    res.json(tags);
  });

  return null;
}