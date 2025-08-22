import { exit } from 'node:process';
import database from '../../src/database.js';
import init from '../../src/init.js';
import pHash from '../../src/lib/phash.js';
import { th } from 'date-fns/locale';

const settings = init.getSettings();
const phash = new pHash(settings);

const conf = {
  login_id: 'admin',
  login_pass: 'admin',
  user_name: 'AdminUser',
}

const data = {
  login_id: conf.login_id,
  login_pass: conf.login_pass,
  user_name: conf.user_name,
  user_id: null,
  contents: [],
  tags: [],
  dirs: [],
  threads: [],
}

// create user
await database('users').insert({
  login_id: data.login_id,
  display_name: data.user_name,
  hashed_password: await phash.hashPassword(data.login_pass),
});
data.user_id = (await database('users').select('id').where({ login_id: data.login_id }).first()).id;

let d = null;
// add contents
for(let i=0;i<50;i++){
  d = await database('contents').insert({
    title: 'テストデータ ' + (i+1),
    revision: 1,
    contents: 'これはサンプルコンテンツ(' + (i+1) + ')の本文です。',
    updated_user_id: data.user_id,
    created_user_id: data.user_id,
  }).returning('id');
  data.contents.push({
    id: d[0].id
  });
}
// add Tags
for(let i=0;i<10;i++){
  data.tags.push({
    id: (await database('tags').insert({
      tag_id: "tag" + (i+1),
      display_name: "タグ" + (i+1),
      updated_user_id: data.user_id,
      created_user_id: data.user_id
    }).returning('id'))[0].id
  });
}
// add dirs
for(let i=0;i<5;i++){
  data.dirs.push({
    id: (await database('dirs').insert({
      dir_id: "dir" + (i+1),
      display_name: "ディレクトリ" + (i+1),
      updated_user_id: data.user_id,
      created_user_id: data.user_id
    }).returning('id'))[0].id,
    dir_id: "dir" + (i+1),
  });
  await database('dirtree').insert({
    parent_id: -1,
    child_id: data.dirs.filter(d => d.dir_id === "dir" + (i+1))[0].id
  });
}
// make subdir
let subdir = null;
subdir = data.dirs.filter(d => d.dir_id === 'dir1')[0];
subdir.subdirs = [];
for(let i=0;i<3;i++){
  const id = (await database('dirs').insert({
    dir_id: "subdir1-" + (i+1),
    display_name: "サブディレクトリ1-" + (i+1),
    updated_user_id: data.user_id,
    created_user_id: data.user_id
  }).returning('id'))[0].id;
  subdir.subdirs.push({
    id,
    dir_id: "subdir1-" + (i+1)
  });
  await database('dirtree').insert({
    parent_id: subdir.id,
    child_id: id,
  });
}
subdir = data.dirs.filter(d => d.dir_id === 'dir3')[0];
subdir.subdirs = [];
for(let i=0;i<5;i++){
  const id = (await database('dirs').insert({
    dir_id: "subdir3-" + (i+1),
    display_name: "サブディレクトリ3-" + (i+1),
    updated_user_id: data.user_id,
    created_user_id: data.user_id
  }).returning('id'))[0].id;
  subdir.subdirs.push({
    id,
    dir_id: "subdir3-" + (i+1)
  });
  await database('dirtree').insert({
    parent_id: subdir.id,
    child_id: id,
  });
}
subdir = data.dirs.filter(d => d.dir_id === 'dir3')[0].subdirs.filter(d => d.dir_id === 'subdir3-2')[0];
subdir.subdirs = [];
for(let i=0;i<3;i++){
  const id = (await database('dirs').insert({
    dir_id: "subdir3-2-" + (i+1),
    display_name: "サブディレクトリ3-2-" + (i+1),
    updated_user_id: data.user_id,
    created_user_id: data.user_id
  }).returning('id'))[0].id;
  subdir.subdirs.push({
    id,
    dir_id: "subdir3-2-" + (i+1)
  });
  await database('dirtree').insert({
    parent_id: subdir.id,
    child_id: id,
  });
}
subdir = data.dirs.filter(d => d.dir_id === 'dir3')[0].subdirs.filter(d => d.dir_id === 'subdir3-2')[0].subdirs.filter(d => d.dir_id === 'subdir3-2-1')[0];
subdir.subdirs = [];
for(let i=0;i<3;i++){
  const id = (await database('dirs').insert({
    dir_id: "subdir3-2-1-" + (i+1),
    display_name: "サブディレクトリ3-2-1-" + (i+1),
    updated_user_id: data.user_id,
    created_user_id: data.user_id
  }).returning('id'))[0].id;
  subdir.subdirs.push({
    id,
    dir_id: "subdir3-2-1-" + (i+1)
  });
  await database('dirtree').insert({
    parent_id: subdir.id,
    child_id: id,
  });
}

// create threads
let contents_index = 0;
for(let i=0;i<50;i++){
  const id = (await database('threads').insert({
    thread_id: "thread" + (i+1),
    title: "スレッド" + (i+1),
    dirtree_id: data.dirs.filter(d => d.dir_id === 'dir3')[0].subdirs.filter(d => d.dir_id === 'subdir3-2')[0].subdirs.filter(d => d.dir_id === 'subdir3-2-1')[0].id,
    contents_id: data.contents[contents_index].id,
    status: 0,
    updated_user_id: data.user_id,
    created_user_id: data.user_id,
    last_updated_user_id: data.user_id,
  }).returning('id'))[0].id;
  data.threads.push({
    id,
    thread_id: "thread" + (i+1)
  });
  contents_index++;
}
// create tags for threads
for(let i=0;i<data.tags.length;i++){
  await database('map_thread_tag').insert({
    thread_id: data.threads.filter(t => t.thread_id === "thread1")[0].id ,
    tag_id: data.tags[i].id,
    created_user_id: data.user_id
  });
}
for(let i=0;i<data.tags.length/2;i++){
  await database('map_thread_tag').insert({
    thread_id: data.threads.filter(t => t.thread_id === "thread2")[0].id ,
    tag_id: data.tags[i].id,
    created_user_id: data.user_id
  });
}
for(let i=0;i<data.tags.length/4;i++){
  await database('map_thread_tag').insert({
    thread_id: data.threads.filter(t => t.thread_id === "thread3")[0].id ,
    tag_id: data.tags[i].id,
    created_user_id: data.user_id
  });
}

await database.destroy()
exit(0);
