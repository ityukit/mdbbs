import { v7 as uuidv7 } from 'uuid';
  
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';
import contentsDiffController from '../../../lib/contentsDiffController.js';

const settings = init.getSettings();

async function updateThread(targetId, title, contentTitle, content, parser, tags, fkey, skey, req, res, tx){
  // check target thread
  const chkThread = await tx.select('id', 'dirtree_id', 'contents_id').from('threads').where({ thread_id: targetId });
  if (chkThread.length === 0) {
    return res.status(404).json({ error: 'Target thread not found' });
  }
  // update contents with diff
  if (!await contentsDiffController.insert(chkThread[0].contents_id, contentTitle, content, parser, '', req.session.user.id, tx)) {
    return res.status(500).json({ error: 'Failed to update contents' });
  }
  // update thread
  await tx('threads')
        .where('id', chkThread[0].id)
        .update({
          title: title,
          updated_user_id: req.session.user.id,
          last_updated_user_id: req.session.user.id,
          updated_at: tx.fn.now(6),
          last_updated_at: tx.fn.now(6),
        });
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
      const chk4 = await tx.select('id').from('map_thread_tag').where({ thread_id: chkThread[0].id, tag_id: tagid[0].id });
      if (chk4.length === 0) {
        await tx('map_thread_tag').insert({
          thread_id: chkThread[0].id,
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
      const chk4 = await tx.select('id').from('map_thread_tag').where({ thread_id: chkThread[0].id, tag_id: tagid[0].id });
      if (chk4.length === 0) {
        await tx('map_thread_tag').insert({
          thread_id: chkThread[0].id,
          tag_id: tagid[0].id,
          created_user_id: req.session.user.id,
        });
      }
    }
  }
  // delete tags from threadtags
  const existingTags = tags.map(t => t.tag_id).filter(tid => tid !== '');
  if (existingTags.length > 0) {
    const existingTagIds = await tx.select('id').from('tags').whereIn('tag_id', existingTags);
    const existingTagIdList = existingTagIds.map(t => t.id);
    await tx('map_thread_tag')
          .where('thread_id', chkThread[0].id)
          .whereNotIn('tag_id', existingTagIdList)
          .del();
  } else {
    // if no tags provided, remove all tags from the thread
    await tx('map_thread_tag')
          .where('thread_id', chkThread[0].id)
          .del();
  }
  // OK!
  return res.json({
    message: 'thread created successfully'
  });
}

export default async function index(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/threadUpdate', async (req, res) => {
    let { targetId, title, contentTitle, content, parser, tags, firstSortKey, secondSortKey } = req.body;

    if (targetId === undefined || targetId === null || targetId === '') {
      targetId = '';
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
      return await updateThread(targetId, title, contentTitle, content, parser, tags, fkey, skey, req, res, tx);
    });
    // res.json(data);
  });

  return null;
}
