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
                            .orderBy('dirs.first_sort_key', 'asc')
                            .orderBy('dirs.second_sort_key', 'asc')
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
  return merged.sort((a, b) => (a.name > b.name) - (a.name < b.name));
}

async function get_tree_retraverse(id, dir_id, display_name, load_on_demand, db) {
  // check child
  const chkchild = await db.select('parent_id')
                            .from('dirtree')
                            .where('parent_id', id)
                            .limit(1);
  let tree = {
    id: dir_id,
    name: display_name,
    load_on_demand: load_on_demand,
  };
  const treeChildren = await get_tree(dir_id, '', 1, 2, db);
  if (treeChildren) tree.children = treeChildren;
  let parentId = id;
  while(parentId !== -1){
    const parent = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .join('dirtree', 'dirtree.parent_id','=', 'dirs.id')
                            .where('dirtree.child_id', parentId)
                            .orderBy('dirs.first_sort_key', 'asc')
                            .orderBy('dirs.second_sort_key', 'asc')
                            .orderBy('dirs.display_name').limit(1);
  
    if (parent.length === 0){
      // 見つからない……！
      parentId = -1;
    }else{
      // 見つかった
      const newtree = {
        id: parent[0].dir_id,
        name: parent[0].display_name,
        load_on_demand: load_on_demand,
      };
      if (tree) newtree.children = [tree];
      tree = newtree;
      parentId = parent[0].id;
    }
  }
  return tree;
}

async function get_tree_retraverse_full(id, dir_id, display_name, load_on_demand, db) {
  // check child
  const chkchild = await db.select('parent_id')
                            .from('dirtree')
                            .where('parent_id', id)
                            .limit(1);
  let tree = {
    id: dir_id,
    name: display_name,
    load_on_demand: load_on_demand,
  };
  const treeChildren = await get_tree(dir_id, '', 1, 2, db);
  if (treeChildren) tree.children = treeChildren;
  let parentId = id;
  while(parentId !== -1){
    const parent = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                            .from('dirs')
                            .join('dirtree', 'dirtree.parent_id','=', 'dirs.id')
                            .where('dirtree.child_id', parentId)
                            .orderBy('dirs.first_sort_key', 'asc')
                            .orderBy('dirs.second_sort_key', 'asc')
                            .orderBy('dirs.display_name').limit(1);
  
    if (parent.length === 0){
      // 見つからない……！
      parentId = -1;
    }else{
      // 見つかった
      const newtree = {
        id: parent[0].dir_id,
        name: parent[0].display_name,
        load_on_demand: load_on_demand,
        children: await get_tree(parent[0].dir_id, '', 1, 2, db)
      };
      for(let i=0;i<(tree.children||[]).length;i++){
        if (tree.id === newtree.children[i].id) {
          newtree.children[i] = tree;
          break;
        }
      }
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
                            .orderBy('dirs.first_sort_key', 'asc')
                            .orderBy('dirs.second_sort_key', 'asc')
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
    keyword = keyword.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    // has keyword
    // 指定の子ノードを検索
    const tagrets = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                      .from('dirs')
                      .where('dirs.display_name', 'like', `%${keyword}%`)
                      .orderBy('dirs.first_sort_key', 'asc')
                      .orderBy('dirs.second_sort_key', 'asc')
                      .orderBy('dirs.display_name');
    if (tagrets.length === 0) {
      return [];
    }
    let mtree=[]
    for (const target of tagrets) {
      mtree.push(await get_tree_retraverse(target.id,target.dir_id,target.display_name,true, db));
    }
    tree.push(...mergeTree(mtree));
  }
  return tree;
}

async function get_tree_by_id(id, db) {
  const tree = [];
  const tagrets = await db.select('dirs.id', 'dirs.dir_id', 'dirs.display_name')
                    .from('dirs')
                    .where('dirs.dir_id', id)
                    .orderBy('dirs.first_sort_key', 'asc')
                    .orderBy('dirs.second_sort_key', 'asc')
                    .orderBy('dirs.display_name');
  if (tagrets.length === 0) {
    return [];
  }
  let mtree=[]
  for (const target of tagrets) {
    mtree.push(await get_tree_retraverse_full(target.id,target.dir_id,target.display_name,true, db));
  }
  mtree.push(...(await get_tree(null, '', 1, 2, db)));
  tree.push(...mergeTree(mtree));
  return tree;
}

function set_tree_loaded(tree,id,load_on_demand) {
  let has_loaded = false;
  for(const d of tree){
    if (d.id === id) {
      d.load_on_demand = load_on_demand;
      has_loaded = true;
    }
    if (d.children) {
      const r = set_tree_loaded(d.children,id,load_on_demand);
      if (r){
        has_loaded = true;
        d.load_on_demand = load_on_demand;
      }
    }
  }
  return has_loaded;
}

export default async function tree(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/tree', async (req, res) => {
    let tree = null;
    let root = req.query.node || '';
    if (req.query.selected_node) {
      tree = await database.transaction(async (tx) => {
        const d = await get_tree_by_id(req.query.selected_node, tx);
        set_tree_loaded(d, req.query.selected_node, false);
        return d;
      });
    }else{
      const keyword = req.query.keyword || '';
      if (root === '') {
        root = null;
      }
      if (keyword === ''){
        tree = await database.transaction(async (tx) => {
          return await get_tree(root, keyword, 1, 3, tx);
        });
      }else{
        tree = await database.transaction(async (tx) => {
          return await get_tree(root, keyword, 1, null, tx);
        });
      }
    }
    res.json(tree);
  });
  return null;
}
