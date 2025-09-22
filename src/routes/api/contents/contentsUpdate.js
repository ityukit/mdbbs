import { v7 as uuidv7 } from 'uuid';
  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';
import contentsDiffController from '../../../lib/contentsDiffController.js';

const settings = init.getSettings();

async function updateContents(targetId, contentTitle, content, parser, req, res, tx) {
  // get target contents
  const chk = await tx.select('id').from('contents').where({ id: targetId });
  if (chk.length === 0) {
    return res.status(404).json({ error: 'Target contents not found' });
  }
  // update contents with diff
  if (!await contentsDiffController.insert(targetId, contentTitle, content, parser, '', req.session.user.id, tx)) {
    return res.status(500).json({ error: 'Failed to update contents' });
  }
  // OK!
  return res.json({
    message: 'contents updated successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/contentsUpdate', async (req, res) => {
    let { targetId, contentTitle, content, parser } = req.body;

    if (targetId === undefined || targetId === null || targetId === '') {
      return res.status(400).json({ error: 'Target contents ID is required' });
    }
    targetId = utils.parseSafeInt(targetId);
    if (targetId === null) {
      return res.status(400).json({ error: 'Target contents ID must be an integer' });
    }
    if (targetId < 1) {
      return res.status(400).json({ error: 'Target contents ID must be a positive integer' });
    }
    if (contentTitle === undefined || contentTitle === null || contentTitle === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (contentTitle.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less' });
    }
    if (content === undefined || content === null || content === '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (parser === undefined || parser === null || parser === '') {
      parser = 'default';
    }
    let data = await database.transaction(async (tx) => {
      return await updateContents(targetId, contentTitle, content, parser, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
