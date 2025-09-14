import database from '../../database.js';
import viewHelper from "../../lib/viewHelper.js";
import cacheUser from '../../lib/cacheUser.js';
import init from '../../init.js';
import _ from 'lodash';

const settings = init.getSettings();

async function usermapping(uid,db){
  const user = await cacheUser.getUserById(uid, db);
  if (!user) return null;
  return {
    id: user.id,
    // login_id: user.login_id,
    display_name: user.display_name,
    email: user.email,
    description: user.description,
    created_at: user.created_at,
    created_at_str: settings.datetool.format(new Date(user.created_at)),
  }
}

async function getThreadParams(threadId,tx){
   const thread = await tx.select(
      'threads.title',
      'dirs.dir_id',
      'threads.contents_id',
      'threads.status',
      'threads.created_user_id',
      'threads.updated_user_id',
      'threads.last_updated_user_id',
      'threads.created_at',
      'threads.updated_at',
      'threads.last_updated_at',
      database.raw('u_dir_ids(dirs.id) as dir_ids'),
      database.raw('u_dir_names(dirs.id) as dir_names'),
    ).from('threads')
    .join('dirtree', 'dirtree.id', '=', 'threads.dirtree_id')
    .join('dirs', 'dirs.id', '=', 'dirtree.child_id')
    .where('threads.thread_id', threadId)
    .first();
    
   if (!thread) return null;

   const tagsData = await tx.select('tags.tag_id', 'tags.display_name')
     .from('threads')
     .join('map_thread_tag', 'threads.id', '=', 'map_thread_tag.thread_id')
     .join('tags', 'tags.id', '=', 'map_thread_tag.tag_id')
     .where('threads.thread_id', threadId);
  const tags = [];
  for (const tag of tagsData) {
    tags.push({
      id: tag.tag_id,
      display_name: tag.display_name,
    });
  }

   return {
     id: threadId,
     title: thread.title,
     dir_id: thread.dir_id,
     root_contents_id: thread.contents_id,
     status: thread.status,
     created_user: await usermapping(thread.created_user_id, tx),
     updated_user: await usermapping(thread.updated_user_id, tx),
     last_updated_user: await usermapping(thread.last_updated_user_id, tx),
     created_at: thread.created_at.toISOString(),
     created_at_str: settings.datetool.format(thread.created_at),
     updated_at: thread.updated_at.toISOString(),
     updated_at_str: settings.datetool.format(thread.updated_at),
     last_updated_at: thread.last_updated_at.toISOString(),
     last_updated_at_str: settings.datetool.format(thread.last_updated_at),
     dir_ids: thread.dir_ids.split(" > "),
     dir_names: thread.dir_names.split(" > "),
     tags,
   };
}

export default async function index(app, main, contents, subdir, moduleName, settings) {
  contents.get('/:id', async (req, res) => {
    const threadId = req.params.id;
    const threadParams = await database.transaction(async (tx) => {
      return await getThreadParams(threadId, tx);
    });
    if (threadParams) {
      res.render('contents/thread', viewHelper.getParameter({
        thread: threadParams,
        title: _.cloneDeep(threadParams.title + ' - ' +  (settings.config.app.name || 'MDBBS')),
        description: null,
        pageTitle: _.cloneDeep(threadParams.title),
        pageDescription: null,
      }, req, settings, 'contents.thread'));
    }else{
      res.status(404).send('Thread not found');
    }
  });
  return null;
}
