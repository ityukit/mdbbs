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

async function get_coutents_count(cid,db){
  return (await db.queryBuilder().withRecursive('t_contents_list', (qb) => {
    qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
      .from('contents_list')
      .where({ child_id: cid })
      .unionAll((qb) => {
        qb.select(db.raw('-1 as id,-1 as child_id,-2 as parent_id'))
      })
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
        qb.select(db.raw('-1 as id,-1 as child_id,-2 as parent_id'))
      })
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
    const currentRList = await db.queryBuilder().withRecursive('t_contents_list', (qb) => {
      qb.select('contents_list.id', 'contents_list.parent_id', 'contents_list.child_id')
        .from('contents_list')
        .where({ child_id: cid })
        .unionAll((qb) => {
          qb.select(db.raw('-1 as id,-1 as child_id,-2 as parent_id'))
        })
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
        .limit(2);
    if (currentRList && currentRList.length > 0){
      if (currentRList[0].id !== currentList[currentList.length-1].id){
        if (currentRList.length > 1 && currentRList[1].id !== currentList[currentList.length-1].id){
          ret.push(null);
        }
        const contentParsed = await parser.parse(currentRList[0].parser, currentRList[0].contents, currentRList[0].id);
        ret.push({
          id: currentRList[0].id,
          title: currentRList[0].title,
          contents: contentParsed.main,
          toc: contentParsed.toc,
          description: currentRList[0].description,
          locked: currentRList[0].locked,
          updated_user: await usermapping(currentRList[0].updated_user_id, db),
          created_user: await usermapping(currentRList[0].created_user_id, db),
          updated_at: currentRList[0].updated_at.toISOString(),
          updated_at_str: settings.datetool.format(currentRList[0].updated_at),
          created_at: currentRList[0].created_at.toISOString(),
          created_at_str: settings.datetool.format(currentRList[0].created_at),
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
    const childContents = await get_contents(c.child_id, 3, db);
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
    count: (await get_coutents_count(cid, db))
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

export default async function thread(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.get('/contents/thread/:id', async (req, res) => {
    const contentId = req.params.id;
    let subtree = utils.parseSafeInt(req.query?.subtree) || 0;
    const listOnly = req.query?.listOnly === '1';
    const treeOnly = req.query?.treeOnly === '1';

    // safety
    if (subtree < 0) {
      subtree = 0;
    }
    if (subtree > 10) {
      subtree = 10;
    }

    // データベースからスレッドの内容を取得
    const threadData = await database.transaction(async (tx) => {
      return await get_thread_by_id(contentId,subtree,listOnly,treeOnly,10, tx);
    });

    if (!threadData){
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(threadData);
  });
  return null;
}
