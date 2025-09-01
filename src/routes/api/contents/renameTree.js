import database from '../../../database.js';
import init from '../../../init.js';

const settings = init.getSettings();

async function rename_tree(dir_id, name, description, req, res, tx) {
  const chk1 = await tx.select('id').from('dirs').where({ dir_id: dir_id });
  if (chk1.length === 0) {
    return res.status(404).json({ error: 'directory not found' });
  }
  // get parent id
  const chk2 = await tx.select('dirs.id')
                       .from('dirs')
                       .join('dirtree', 'dirtree.parent_id', 'dirs.id')
                       .where('dirtree.child_id', chk1[0].id);
  if (chk2.length === 0) {
    return res.status(404).json({ error: 'directory not found' });
  }
  // dir's name
  const chk = await tx.select('dirs.id')
                      .from('dirs')
                      .join('dirtree', 'dirtree.child_id', 'dirs.id')
                      .where('dirtree.parent_id', chk2[0].id)
                      .where('dirs.display_name', name);
  if (chk.length > 0) {
    if (chk[0].id !== chk1[0].id) {
      return res.json({
        error: req.__('page.contents.tree.renameDupError'),
      });
    }
  }

  await tx('dirs')
    .where({ id: chk1[0].id })
    .update({
      display_name: name,
      description: description,
      updated_user_id: req.session.user.id,
    });

  // OK!
  return res.json({
    message: 'dir added successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/renameTree', async (req, res) => {
    const { dir_id, name, description } = req.body;

    if (dir_id === undefined || dir_id === null || dir_id === '') {
      return res.status(400).json({ error: 'Directory ID is required' });
    }
    if (name === undefined || name === null || name === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
   if (name.includes(' > ')) {
      return res.status(400).json({ error: 'Name must not contain " > "' });
    }

    let data = await database.transaction(async (tx) => {
      return await rename_tree(dir_id, name, description, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
