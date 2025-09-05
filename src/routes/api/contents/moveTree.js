import { ta } from 'date-fns/locale';
import database from '../../../database.js';
import init from '../../../init.js';

const settings = init.getSettings();

async function movetree(dir_id, target_dir_id, req, res, tx) {
  const chk1 = await tx.select('id','display_name').from('dirs').where({ dir_id: dir_id });
  if (chk1.length === 0) {
    return res.status(404).json({ error: 'directory not found' });
  }
  const id = chk1[0].id;
  const name = chk1[0].display_name;
  let target_id
  if (target_dir_id === ''){
    target_id = -1;
  }else{
    const chk2 = await tx.select('id').from('dirs').where({ dir_id: target_dir_id });
    if (chk2.length === 0) {
      return res.status(404).json({ error: 'target directory not found' });
    }
    target_id = chk2[0].id;
  }
  if (id === target_id) {
    return res.status(400).json({ error: 'Cannot move to the same directory' });
  }
  // target subdir check
  const chk3 = await tx.queryBuilder().withRecursive('t_child_list', (qb) => {
    qb.select('child_id').from('dirtree').where({ parent_id: id })
      .unionAll((qb) => {
        qb.select('dirtree.child_id').from('dirtree')
          .join('t_child_list', 'dirtree.parent_id', '=', 't_child_list.child_id')
      });
  })
  .select('child_id').from('t_child_list').where({ child_id: target_id });
  if (chk3.length > 0) {
    return res.status(400).json({ error: 'Cannot move to the subdirectory' });
  }
  // current duplicate check
  const chk4 = await tx.select('dirs.id')
                       .from('dirs')
                       .join('dirtree', 'dirtree.child_id', 'dirs.id')
                       .where('dirtree.parent_id', target_id)
                       .where('dirs.display_name', name);
  if (chk4.length > 0) {
    return res.status(400).json({ error: 'Directory with the same name exists in the target directory' });
  }
  // chk ok, move
  await tx('dirtree').where({ child_id: id }).update({ parent_id: target_id });
  return res.json({ success: "moved" });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/moveTree', async (req, res) => {
    const { dir_id, target_id } = req.body;

    if (dir_id === undefined || dir_id === null || dir_id === '') {
      return res.status(400).json({ error: 'Directory ID is required' });
    }
    if (target_id === undefined || target_id === null) {
      return res.status(400).json({ error: 'Target ID is required' });
    }
    if (dir_id === target_id) {
      return res.status(400).json({ error: 'Cannot move to the same directory' });
    }


    let data = await database.transaction(async (tx) => {
      return await movetree(dir_id, target_id, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
