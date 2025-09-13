import { v7 as uuidv7 } from 'uuid';
  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';


const settings = init.getSettings();

async function add_tree(name, description, parent, firstSortKey, secondSortKey, req, res, tx) {
  // search parent id
  let parentId = -1;
  if (parent ==  undefined || parent == null || parent === '') {
    // OK
    parent = '';
  } else {
    // get parent id
    const chk1 = await tx.select('id').from('dirs').where({ dir_id: parent });
    if (chk1.length === 0) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }
    parentId = chk1[0].id;
  }
  // dir's name
  const chk = await tx.select('dirs.id')
                      .from('dirs')
                      .join('dirtree', 'dirtree.child_id', 'dirs.id')
                      .where('dirtree.parent_id', parentId)
                      .where('dirs.display_name', name);
  if (chk.length > 0) {
    return res.json({
      error: req.__('page.contents.tree.addDupError'),
    });
  }

  let id = null;
  let c = 0;
  while(id === null){
    if (c > 10) {
      return res.status(500).json({ error: 'Failed to generate unique ID' });
    }
    const t = "tree_id_" + uuidv7();
    const exists = await tx.select('id').from('dirs').where({ dir_id: t });
    if (exists.length === 0) {
      id = t;
    }
    c++;
  }
  const dir = {
    dir_id: id,
    display_name: name,
    description,
    first_sort_key: firstSortKey,
    second_sort_key: secondSortKey,
    created_user_id: req.session.user.id,
    updated_user_id: req.session.user.id,
  };
  const dir_id = await tx('dirs').insert(dir).returning('id');
  await tx('dirtree').insert({ parent_id: parentId, child_id: dir_id[0].id });
  // OK!
  return res.json({
    message: 'dir added successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/addTree', async (req, res) => {
    const { name, description, parent, firstSortKey, secondSortKey } = req.body;

    if (name === undefined || name === null || name === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (name.includes(' > ')) {
      return res.status(400).json({ error: 'Name must not contain " > "' });
    }
    let fkey = utils.parseSafeInt(firstSortKey, 0);
    let skey = secondSortKey;
    if (skey === undefined || skey === null || skey === '') {
      skey = '';
    }
    if (skey.length > 255) {
      return res.status(400).json({ error: 'Second sort key must be 255 characters or less' });
    }

    let data = await database.transaction(async (tx) => {
      return await add_tree(name, description, parent, fkey, skey, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
