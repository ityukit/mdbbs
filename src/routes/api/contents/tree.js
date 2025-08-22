import { el } from 'date-fns/locale';
import database from '../../../database.js';
import e from 'express';

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
    return null;
  }
  for (const data of await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .join('dirtree', 'dirtree.child_id','=', 'dirs.id')
                            .where('dirtree.parent_id', id)
                            .orderBy('dirs.display_name')){
    const children = await get_tree_traverse(data.id, currentDepth + 1, maxDepth, db);
    const node = {
      id: data.dir_id,
      name: data.display_name,
      load_on_demand: true,
    };
    if (children) node.children = children;
    tree.push(node);
  }
  return tree;
}
function subtreeMerge(a,b){
  if (!a.children) a.children = [];
  const existing = a.children.find(item => item.id === b.id);
  if (existing){
    // 既に存在するノードはマージ
    for (let c of b.children || []){
      subtreeMerge(existing, c);
    }
  }else{
    a.children.push(b);
  }
}
function mergeTree(tree){
  const merged = [];
  const map = {};
  for(const t of tree){
    if (!map[t.id]){
      map[t.id] = t;
      merged.push(t);
    }else{
      for (let c of t.children || []){
        subtreeMerge(map[t.id], c);
      }
    }
  }

  return merged;
}

async function get_tree_retraverse(id, dir_id, display_name, db) {
  // check child
  const chkchild = await db.select('parent_id')
                            .from('dirtree')
                            .where('parent_id', id)
                            .limit(1);
  let tree = {
    id: dir_id,
    name: display_name,
    load_on_demand: false,
  };
  let parentId = id;
  while(parentId !== -1){
    const parent = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .join('dirtree', 'dirtree.parent_id','=', 'dirs.id')
                            .where('dirtree.child_id', parentId)
                            .orderBy('dirs.display_name').limit(1);
  
    if (parent.length === 0){
      // 見つからない……！
      parentId = -1;
    }else{
      // 見つかった
      const newtree = {
        id: parent[0].dir_id,
        name: parent[0].display_name,
        load_on_demand: false,
      };
      if (tree) newtree.children = [tree];
      tree = newtree;
      parentId = parent[0].id;
    }
  }
  return tree;
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
      ).from('dirs').where({'dir_id': root}).limit(1);
      if (rootData.length === 0) {
        return [];
      }
      start_parentId = rootData[0].id;
    }
    for (const data of await db.select(
                                'dirs.id','dirs.dir_id','dirs.display_name'
                              )
                            .from('dirs')
                            .join('dirtree', 'dirs.id','=', 'dirtree.child_id')
                            .where({'dirtree.parent_id': start_parentId})
                            .orderBy('dirs.display_name')) {
      const children = await get_tree_traverse(data.id, currentDepth + 1, maxDepth, db);
      const node = {
        id: data.dir_id,
        name: data.display_name,
        load_on_demand: true,
      };
      if (children) node.children = children;
      tree.push(node);
    }
  }else{
    // has keyword
    // 指定の子ノードを検索
    const tagrets = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                      .from('dirs')
                      .join('dirtree', 'dirtree.child_id','=', 'dirs.id')
                      .where('dirs.display_name', 'like', `%${keyword}%`)
                      .orderBy('dirs.display_name');
    if (tagrets.length === 0) {
      return [];
    }
    let mtree=[]
    for (const target of tagrets) {
      mtree.push(await get_tree_retraverse(target.id,target.dir_id,target.display_name, db));
    }
    tree.push(...mergeTree(mtree));
  }
  return tree;
}

export default async function tree(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/tree', async (req, res) => {
    let root = req.query.node || '';
    //if (req.query.selected_node) {
    //  root = req.query.selected_node;
    //}
    const keyword = req.query.keyword || '';
    if (root === '') {
      root = null;
    }
    let tree = null;
    if (keyword === ''){
      tree = await database.transaction(async (tx) => {
        return await get_tree(root, keyword, 1, 3, tx);
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