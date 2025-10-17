import { v7 as uuidv7 } from 'uuid';
  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';
import permissions from '../../../lib/permissions.js';

const settings = init.getSettings();

async function createContents(targetContentsId, contentsTitle, content, parser, mode, req, res, tx){
  // get target contents
  const chk = await tx.select('id').from('contents').where({ id: targetContentsId });
  if (chk.length === 0) {
    return res.status(404).json({ error: 'Target contents not found' });
  }
  // check permission(parentId)
  if (!await permissions.isAllowed(tx, 
                                   req.session.user.id,
                                   'content.create',
                                   permissions.TARGET_CONTENTS,
                                   targetContentsId,
                                   {})) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // check if listmode
  if (mode == 'list') {
    const chk2 = await tx.select('id').from('contents_list').where({ parent_id: targetContentsId });
    if (chk2.length !== 0) {
      return res.status(400).json({ error: 'Target contents has list:child' });
    }
  }else if (mode == 'tree') {
    const chk2 = await tx.select('id').from('contents_list').where({ parent_id: targetContentsId });
    if (chk2.length === 0){
      return res.status(400).json({ error: 'Target contents does not have list:child' });
    }
  }else if (mode == 'auto') {
    const chk2 = await tx.select('id').from('contents_list').where({ parent_id: targetContentsId });
    if (chk2.length === 0) {
      mode = 'list';
    }else{
      mode = 'tree';
    }
  }
  // create contents
  const contentId = await tx('contents').insert({
    title: contentsTitle,
    revision: 1,
    contents: content,
    parser: parser,
    description: '',
    visibled: true,
    enabled: true,
    locked: false,
    updated_user_id: req.session.user.id,
    created_user_id: req.session.user.id,
  }).returning('id');
  if (mode == 'list') {
    // insert to contents_list
    await tx('contents_list').insert({
      parent_id: targetContentsId,
      child_id: contentId[0].id,
    });
  }else if (mode == 'tree') {
    // insert to contents_list
    await tx('contents_list').insert({
      parent_id: -1,
      child_id: contentId[0].id,
    });
    // insert to contents_tree
    await tx('contents_tree').insert({
      parent_id: targetContentsId,
      child_id: contentId[0].id,
    });
  }else{
    return res.status(400).json({ error: 'Invalid mode' });
  }
  // OK!
  // permition set
  await permissions.createResource(
    tx,
    permissions.TARGET_CONTENTS,
    contentId[0].id,
    permissions.TARGET_CONTENTS,
    targetContentsId,
    true,
    false
  );
  return res.json({
    message: 'contents created successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/contentsCreate', async (req, res) => {
    let { targetContentsId, contentTitle, content, parser, mode } = req.body;

    if (targetContentsId === undefined || targetContentsId === null || targetContentsId === '') {
      return res.status(400).json({ error: 'Target contents ID is required' });
    }
    targetContentsId = utils.parseSafeInt(targetContentsId);
    if (targetContentsId === null) {
      return res.status(400).json({ error: 'Target contents ID must be an integer' });
    }
    if (targetContentsId < 1) {
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
    if (mode === undefined || mode === null || mode === '') {
      mode = 'auto';
    }
    if (mode !== 'list' && mode !== 'tree' && mode !== 'auto') {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    let data = await database.transaction(async (tx) => {
      return await createContents(targetContentsId, contentTitle, content, parser, mode, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
