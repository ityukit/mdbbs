import parser from '../../../lib/parser.js';
import cacheUser from '../../../lib/cacheUser.js';
import database from '../../../database.js';
import init from '../../../init.js';
import utils from '../../../lib/utils.js';

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

async function get_contents_count(cid,db){
  return (await db.queryBuilder().withRecursive('t_contents_list', (qb) => {
    qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
      .from('contents_list')
      .where({ child_id: cid })
      .unionAll((qb) => {
        qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
          .from('t_contents_list')
          .join('contents_list', 't_contents_list.child_id', '=', 'contents_list.parent_id')
          .where('contents_list.parent_id', '>', 0)
      });
    })
    .count('t_contents_list.id as cnt').from('t_contents_list').first()).cnt;
}
async function get_contents(cid,listmax,db) {
  let ret = [];
  const currentList = await db.queryBuilder().withRecursive('t_contents_list', (qb) => {
    qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
      .from('contents_list')
      .where({ child_id: cid })
      .unionAll((qb) => {
        qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
          .from('t_contents_list')
          .join('contents_list', 't_contents_list.child_id', '=', 'contents_list.parent_id')
      });
    })
    .select(
        'contents.id',
        'contents.title',
        'contents.contents',
        'contents.parser',
        'contents.description',
        'contents.visibled',
        'contents.enabled',
        'contents.locked',
        'contents.updated_user_id',
        'contents.created_user_id',
        'contents.created_at',
        'contents.updated_at',
      ).from('t_contents_list')
      .join('contents','t_contents_list.child_id','=','contents.id')
      .orderBy('contents.created_at','asc')
      .orderBy('contents.id','asc')
      .limit(listmax);
  if (!currentList) return null;
  //console.log("currentList:", currentList);
  for(const c of currentList){
    const contentParsed = await parser.parse(c.parser, c.contents, c.id);
    ret.push({
      id: c.id,
      title: c.title,
      contents: contentParsed.main,
      toc: contentParsed.toc,
      description: c.description,
      locked: c.locked,
      updated_user: await usermapping(c.updated_user_id, db),
      created_user: await usermapping(c.created_user_id, db),
      updated_at: c.updated_at.toISOString(),
      updated_at_str: settings.datetool.format(c.updated_at),
      created_at: c.created_at.toISOString(),
      created_at_str: settings.datetool.format(c.created_at),
      children: null,
    });
  }
  if (false && currentList.length < listmax) {
    // DO NOTHING
  }else{
    const maxlist = settings.config.pageConfig?.thread?.view?.lastmax || 1;
    const currentRList = await db.queryBuilder().withRecursive('t_contents_list', (qb) => {
      qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
        .from('contents_list')
        .where({ child_id: cid })
        .unionAll((qb) => {
          qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
            .from('t_contents_list')
            .join('contents_list', 't_contents_list.child_id', '=', 'contents_list.parent_id')
        });
      })
      .select(
          'contents.id',
          'contents.title',
          'contents.contents',
          'contents.parser',
          'contents.description',
          'contents.visibled',
          'contents.enabled',
          'contents.locked',
          'contents.updated_user_id',
          'contents.created_user_id',
          'contents.created_at',
          'contents.updated_at',
          't_contents_list.parent_id',
          't_contents_list.child_id'
        ).from('t_contents_list')
        .join('contents','t_contents_list.child_id','=','contents.id')
        .orderBy('contents.created_at','desc')
        .orderBy('contents.id','desc')
        .limit(maxlist+1);
    if (currentRList && currentRList.length > 0){
      let chkdup = currentRList.length+1;
      for (let i=0;i<currentRList.length;i++){
        const cr = currentRList[i];
        if (cr.id === currentList[currentList.length-1].id) {
          chkdup = i;
          break;
        }
      }
      if (chkdup >= maxlist){
        ret.push(null);
      }
      // add last
      for(let i=Math.min(currentRList.length,maxlist,chkdup)-1;i >=0;i--){
        const contentParsed = await parser.parse(currentRList[i].parser, currentRList[i].contents, currentRList[i].id);
        ret.push({
          id: currentRList[i].id,
          title: currentRList[i].title,
          contents: contentParsed.main,
          toc: contentParsed.toc,
          description: currentRList[i].description,
          locked: currentRList[i].locked,
          updated_user: await usermapping(currentRList[i].updated_user_id, db),
          created_user: await usermapping(currentRList[i].created_user_id, db),
          updated_at: currentRList[i].updated_at.toISOString(),
          updated_at_str: settings.datetool.format(currentRList[i].updated_at),
          created_at: currentRList[i].created_at.toISOString(),
          created_at_str: settings.datetool.format(currentRList[i].created_at),
          children: null,
        });
      }
    }
  }
  //console.log("ret:", cid,listmax,ret);
  return ret;
}

async function get_child_contents(cid, subtree,listOnly, db) {
  let ret = [];
  const childs = await db.select('contents_tree.child_id').from('contents_tree').where({ parent_id: cid });
  if (childs.length < 1) return [[],0];
  for(const c of childs) {
    const childContents = await get_contents(c.child_id, settings.config.pageConfig?.thread?.view?.treemax || 2, db);
    if (childContents.length > 0) {
      ret.push(...childContents);
    }
    for(const cc of ret) {
      if (!cc) continue;
      const childCount = await db.count('contents_tree.id as cnt').from('contents_tree').where({ parent_id: cc.id }).first();
      if (subtree > 0){
        if (childCount.cnt > 0) {
          cc.children = (await get_child_contents(cc.id,subtree-1,true, db))[0];
        }
        cc.childCount = childCount.cnt;
      }else{
        cc.children = childCount.cnt > 0 ? null : [];
        cc.childCount = childCount.cnt;
      }
    }
  }
  return [ret,childs.length];
}

async function get_thread_by_id(cid, subtree,listOnly, treeOnly,listMax, db) {
  // check tid and cid
  const chk = await db.select('contents.id').from('contents').where({ id: cid }).first();
  if (!chk) return null;
  // read current list
  let loadListCount = listMax;
  if (treeOnly) loadListCount = 1;
  let ret = {
    contents: await get_contents(cid, loadListCount, db),
    count: (await get_contents_count(cid, db))
  };
  if (listOnly){
    subtree = 0;
  }
  if (treeOnly){
    ret.contents = ret.contents.length > 0 ? [ret.contents[0]] : [];
  }
  for(let i=0;i<ret.contents.length;i++){
    if (!ret.contents[i]) continue;
    const subtree2 = subtree; // i === 0 ? subtree : 0;
    if (subtree2 > 0){
      const c = await get_child_contents(ret.contents[i].id,subtree2-1,listOnly, db);
      ret.contents[i].children = c[0];
      ret.contents[i].childCount = c[1];
    }else{
      const c = await get_child_contents(ret.contents[i].id,0,listOnly, db);
      ret.contents[i].children = c[1] > 0 ? null : [];
      ret.contents[i].childCount = c[1];
    }
  }
  return ret;
}

function findContentIdByContent(contents, id) {
  if (!contents || contents.length < 1) return null;
  for(let i=0;i<contents.length;i++) {
    const c = contents[i];
    if (!c) continue;
    if (c.id === id) return {pos:i,child:-1, content:contents};
    for(let j=0;j<(c.children?.length||0);j++) {
      const cc = c.children[j];
      if (cc.id === id) return {pos:i, child:j, content: c.children};
    }
  }
  return null;
}

async function get_thread_by_required_id(tid, cid, db) {
  if (tid < 1) return null;
  if (cid < 1) return null;
  // check tid and cid
  const chk = await db.select('contents.id').from('contents').where({ id: tid }).first();
  if (!chk) return null;
  const chk2 = await db.select('contents.id').from('contents').where({ id: cid }).first();
  if (!chk2) return null;
  // read current list
  const path = await db.select(db.raw(`u_contents_list_tree_ids(?) as path`, [cid])).first();
  if (!path || !path.path) return null;
  const ids = path.path.split(' > ').map(v=>parseInt(v)).filter(v=>!isNaN(v) && v>0);
  if (ids.indexOf(tid) < 0) return null;
  const dids = ids.slice(ids.indexOf(tid));
  if (dids.length < 1) return null;
  // read contents
  let contents = null;
  let current = null;
  for(const id of dids) {
    if (id < 1) return null;
    const content = await get_contents(id, 1, db);
    if (!content) return null;
    if (!contents) {
      contents = content;
      current = contents;
    }
    const c = findContentIdByContent(current, id);
    console.log("findContentIdByContent:", content, contents,id, c);
    if (!c) {
      return null;
    }
    if (c.child >= 0){
      if (!current[c.pos].children) current[c.pos].children = [];
      current = current[c.pos].children = content;
    }else{
      current.splice(c.pos,Infinity, ...content) ;
    }
    current = c.content;
  }
  let ret = {
    contents: contents,
    count: (await get_contents_count(tid, db))
  };
  return ret;
}

export default async function thread(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/thread/:id', async (req, res) => {
    const contentId = utils.parseSafeInt(req.params.id) || 0;
    let subtree = utils.parseSafeInt(req.query?.subtree) || 0;
    const listOnly = req.query?.listOnly === '1';
    const treeOnly = req.query?.treeOnly === '1';
    const require_content_id = utils.parseSafeInt(req.query?.require_content_id) || null;

    if (contentId < 1) {
      return res.status(400).json({ error: 'Invalid content ID' });
    }
    // safety
    if (subtree < settings.config.pageConfig?.thread?.view?.treemax || 1) {
      subtree = settings.config.pageConfig?.thread?.view?.treemax || 1;
    }
    if (subtree > 10) {
      subtree = 10;
    }

    // データベースからスレッドの内容を取得
    const threadData = await database.transaction(async (tx) => {
      if (require_content_id && require_content_id != contentId){
        return await get_thread_by_required_id(contentId,require_content_id, tx);
      }else{
        return await get_thread_by_id(contentId,subtree,listOnly,treeOnly,settings.config.pageConfig?.thread?.view?.listmax || 10, tx);
      }
    });

    if (!threadData){
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(threadData);
  });
  return null;
}
