  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';
import contentsDiffController from '../../../lib/contentsDiffController.js';

const settings = init.getSettings();

async function moveThread(id, dir_id, req, res, tx){
  // check target thread
  const chkThread = await tx.select('id', 'dirtree_id', 'contents_id').from('threads').where({ thread_id: id });
  if (chkThread.length === 0) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  // check target directory
  let dirid = -1; // root
  if (dir_id !== '') {
    const chkDir = await tx.select('id').from('dirs').where({ dir_id: dir_id });
    if (chkDir.length === 0) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    dirid = chkDir[0].id;
  }
  // move thread
  // load dirtree_id
  const chkDirtree = await tx.select('id').from('dirtree').where({ child_id: dirid });
  if (chkDirtree.length === 0) {
    return res.status(404).json({ error: 'Dirtree not found' });
  }
  await tx('threads')
        .where('id', chkThread[0].id)
        .update({
          dirtree_id: chkDirtree[0].id,
          updated_user_id: req.session.user.id,
          updated_at: tx.fn.now(6),
        });
  // OK!
  return res.json({
    message: 'thread moved successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/threadMove', async (req, res) => {
    let { id, dir_id } = req.body;

    if (id === undefined || id === null || id === '') {
      return res.status(400).json({ error: 'ID is required' });
    }
    if (dir_id === undefined || dir_id === null || dir_id === '') {
      dir_id = '';
    }

    let data = await database.transaction(async (tx) => {
      return await moveThread(id, dir_id, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
