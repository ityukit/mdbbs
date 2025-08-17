import { el } from 'date-fns/locale';
import database from '../../../database.js';

async function get_tree_traverse(id, currentDepth, maxDepth, db) {
  // check child
  const chkchild = await db.select('parent_id')
                            .from('dirtree')
                            .where('parent_id', id)
                            .limit(1);
  if (chkchild.length === 0) {
    return null;
  }
  // 子ノードはいる
  const tree = [];
  if (maxDepth && currentDepth >= maxDepth){
    return [];
  }
  for (const data of await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .leftJoin('dirtree', 'dirtree.child_id', 'dirs.id')
                            .where('dirtree.parent_id', id)
                            .orderBy('dirs.display_name')){
    const children = await get_tree_sub(data.id, keyword, currentDepth + 1, maxDepth, db);
    const node = {
      id: data.dir_id,
      text: data.display_name,
      hasChildren: children !== null ? true : false,
      children: children,
      expanded: true,
    };
    tree.push(node);
  }
  return tree;
}

async function get_tree_retraverse(id, db) {
  // check child
  const chkchild = await db.select('parent_id')
                            .from('dirtree')
                            .where('parent_id', id)
                            .limit(1);
  let tree = null;
  let parentId = id;
  while(parentId !== -1){
    const parent = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .leftJoin('dirtree', 'dirtree.parent_id', 'dirs.id')
                            .where('dirtree.child_id', parentId)
                            .orderBy('dirs.display_name').limit(1);
  
    if (parent.length === 0){
      // 見つからない……！
      parentId = -1;
    }else{
      // 見つかった
      const newtree = {
        id: parent[0].dir_id,
        text: parent[0].display_name,
        hasChildren: tree !== null ? true : false,
        children: tree,
        expanded: true,
      };
      tree = newtree;
      parentId = parent[0].id;
    }
  }
  return {
    hasChildren: chkchild.length > 0 ? true : false,
    tree: tree,
  };
}

async function get_tree(root, keyword, currentDepth, maxDepth, db) {
  const tree = [];
  if (keyword === ''){
    let start_parentId = -1;
    if (root === null){
      // DO NOTHING
    }else{
      const rootData = await db.select(
        'dirs.id','dirs.dir_id','dirs.display_name'
      ).from('dirs').where({'dir_id': root}).first();
      if (rootData.length === 0) {
        return [];
      }
      start_parentId = rootData[0].id;
    }
    for (const data of await db.select(
                                'dirs.id','dirs.dir_id','dirs.display_name'
                              )
                            .from('dirs')
                            .leftJoin('dirtree', 'dirs.id', 'dirtree.child_id')
                            .where({'dirtree.parent_id': start_parentId})
                            .orderBy('dirs.display_name')) {
      const children = await get_tree_traverse(data.id, currentDepth + 1, maxDepth, db);
      const node = {
        id: data.dir_id,
        text: data.display_name,
        hasChildren: children !== null ? true : false,
        children: children,
        expanded: true,
      };
      tree.push(node);
    }
  }else{
    // has keyword
    // 指定の子ノードを検索
    const tagrets = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                      .from('dirs')
                      .leftJoin('dirtree', 'dirtree.child_id', 'dirs.id')
                      .where('dirs.display_name', 'like', `%${keyword}%`)
                      .orderBy('dirs.display_name');
    if (tagrets.length === 0) {
      return [];
    }
    for (const target of tagrets) {
      const childData = await get_tree_retraverse(target.id, db);
      const node = {
        id: target.dir_id,
        text: target.display_name,
        hasChildren: childData.hasChildren,
        children: childData.tree,
        expanded: true,
      };
      tree.push(node);
    }
  }
  return tree;
}

export default async function tree(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/tree', async (req, res) => {
    let root = req.query.root || 'source';
    const keyword = req.query.keyword || '';
    if (root === 'source') {
      root = null;
    }
    let tree = null;
    if (keyword === ''){
      tree = await database.transaction(async (tx) => {
        return await get_tree(root, keyword, 1, 2, tx);
      });
    }else{
      tree = await database.transaction(async (tx) => {
        return await get_tree(root, keyword, 1, null, tx);
      });
    }
    res.json(tree);
  });

  return null;
}