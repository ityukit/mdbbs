import { v7 as uuidv7 } from 'uuid';
  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';

const settings = init.getSettings();

async function createThread(nodeId, title, contentTitle, content, parser, tags, fkey, skey, req, res, tx){
  // search parent id
  let parentId = -1;
  if (nodeId ==  undefined || nodeId == null || nodeId === '') {
    // OK
    parentId = -1;
  } else {
    // get parent id
    const chk1 = await tx.select('id').from('dirs').where({ dir_id: nodeId });
    if (chk1.length === 0) {
      return res.status(404).json({ error: 'Parent directory not found' });
    }
    parentId = chk1[0].id;
  }
  // create contents
  const contentId = await tx('contents').insert({
    title: contentTitle,
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
  // insert to contents_list
  await tx('contents_list').insert({
    parent_id: -1,
    child_id: contentId[0].id,
  });
  // insert to contents_tree
  await tx('contents_tree').insert({
    parent_id: -1,
    child_id: contentId[0].id,
  });
  // get dirtree id
  let dirtreeId = -1;
  if (parentId !== -1) {
    const chk2 = await tx.select('id').from('dirtree').where({ child_id: parentId });
    if (chk2.length === 0) {
      return res.status(500).json({ error: 'Root directory not found' });
    }
    dirtreeId = chk2[0].id;
  }
  // create thread
  let threadId = null;
  let c = 0;
  while(threadId === null){
    if (c > 10) {
      return res.status(500).json({ error: 'Failed to generate unique ID' });
    }
    const t = "thread_id_" + uuidv7();
    const exists = await tx.select('id').from('threads').where({ thread_id: t });
    if (exists.length === 0) {
      threadId = t;
    }
    c++;
  }
  if (threadId === null) {
    return res.status(500).json({ error: 'Failed to generate unique ID' });
  } 
  const threadid = await tx('threads').insert({
    thread_id: threadId,
    title: title,
    dirtree_id: dirtreeId,
    contents_id: contentId[0].id,
    status: 0,
    visibled: true,
    enabled: true,
    locked: false,
    first_sort_key: fkey,
    second_sort_key: skey,
    created_user_id: req.session.user.id,
    updated_user_id: req.session.user.id,
    last_updated_user_id: req.session.user.id,
  }).returning('id');
  // insert to tags and threadtags
  for(let i=0; i<tags.length; i++) {
    if (tags[i].tag_id === '') {
      // new tag
      const tagName = tags[i].display_name;
      const chk3 = await tx.select('id').from('tags').where({ display_name: tagName });
      let tagid = chk3.length > 0 ? chk3 : null;
      if (chk3.length === 0) {
        // tag name not exists
        let tagId = null;
        let c2 = 0;
        while(tagId === null){
          if (c2 > 10) {
            return res.status(500).json({ error: 'Failed to generate unique ID' });
          }
          const t2 = "tag_id_" + uuidv7();
          const exists2 = await tx.select('id').from('tags').where({ tag_id: t2 });
          if (exists2.length === 0) {
            tagId = t2;
          }
          c2++;
        }
        if (tagId === null) {
          return res.status(500).json({ error: 'Failed to generate unique ID' });
        } 
        tagid = await tx('tags').insert({
          tag_id: tagId,
          display_name: tagName,
          description: '',
          visibled: true,
          enabled: true,
          created_user_id: req.session.user.id,
          updated_user_id: req.session.user.id,
        }).returning('id');
      }
      // insert to threadtags
      const chk4 = await tx.select('id').from('map_thread_tag').where({ thread_id: threadid[0].id, tag_id: tagid[0].id });
      if (chk4.length === 0) {
        await tx('map_thread_tag').insert({
          thread_id: threadid[0].id,
          tag_id: tagid[0].id,
          created_user_id: req.session.user.id,
        }); 
      }
    }else{
      // existing tag
      const tagid = await tx.select('id').from('tags').where({ tag_id: tags[i].tag_id });
      if (tagid.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      // insert to threadtags
      const chk4 = await tx.select('id').from('map_thread_tag').where({ thread_id: threadid[0].id, tag_id: tagid[0].id });
      if (chk4.length === 0) {
        await tx('map_thread_tag').insert({
          thread_id: threadid[0].id,
          tag_id: tagid[0].id,
          created_user_id: req.session.user.id,
        });
      }
    }
  }
  // OK!
  return res.json({
    message: 'thread created successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/threadCreate', async (req, res) => {
    let { nodeId, title, contentTitle, content, parser, tags, firstSortKey, secondSortKey } = req.body;

    if (nodeId === undefined || nodeId === null || nodeId === '') {
      nodeId = '';
    }
    if (title === undefined || title === null || title === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less' });
    }
    if (contentTitle === undefined || contentTitle === null || contentTitle === '') {
      return res.status(400).json({ error: 'Content title is required' });
    }
    if (contentTitle.length > 255) {
      return res.status(400).json({ error: 'Content title must be 255 characters or less' });
    }
    if (content === undefined || content === null || content === '') {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (parser === undefined || parser === null || parser === '') {
      parser = 'default';
    }
    if (tags === undefined || tags === null) {
      tags = [];
    }
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }
    if (tags.length > 30) {
      return res.status(400).json({ error: 'You can specify up to 30 tags' });
    }
    for(let i=0; i<tags.length; i++) {
      if(tags[i] === undefined || tags[i] === null) {
        return res.status(400).json({ error: 'Tag name is required' });
      }
      if (tags[i].tag_id === undefined || tags[i].tag_id === null || typeof tags[i].tag_id !== 'string') {
        return res.status(400).json({ error: 'Tag ID is required' });
      }
      if (tags[i].display_name === undefined || tags[i].display_name === null || typeof tags[i].display_name !== 'string') {
        return res.status(400).json({ error: 'Tag name is required' });
      }
      if (tags[i].display_name.length > 50) {
        return res.status(400).json({ error: 'Tag name must be 50 characters or less' });
      }
      if (tags[i].tag_id === '' && tags[i].display_name === '') {
        return res.status(400).json({ error: 'Tag name is required' });
      }
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
      return await createThread(nodeId, title, contentTitle, content, parser, tags, fkey, skey, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
