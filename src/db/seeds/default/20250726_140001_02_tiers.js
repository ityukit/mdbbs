async function special_insert(trx, id, name, parent_id) {
  const c = await trx.select('id').from('tiers').where('name',name).first();
  if(!c){
    console.log(`Inserting tiers ${name}`);
    const ids = await trx('tiers').insert({
      id: id,
      name: name,
      parent_id: parent_id,
    }).returning('id');
    return ids[0].id;
  }else{
    if (c.id !== id) {
      throw new Error(`Tier ${name} id mismatch: expected ${id}, got ${c.id}`);
    }
  }
  return c.id;
}

async function insert(trx, name, parent_id) {
  const c = await trx.select('id').from('tiers').where('name',name).first();
  if(!c){
    console.log(`Inserting tiers ${name}`);
    const ids = await trx('tiers').insert({
      name: name,
      parent_id: parent_id,
    }).returning('id');
    return ids[0].id;
  }
  return c.id;
}

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    // 特別階層
    await special_insert(trx, -1, 'SYSTEM_NONE', -1);
    await special_insert(trx, -2, 'SYSTEM_DISABLED', -1);
    // デフォルト
    const guestid = await insert(trx, 'guest', -1);
    const userid = await insert(trx, 'user', -1);
    const poweruserid = await insert(trx, 'poweruser', userid);
    const adminid = await insert(trx, 'admin', poweruserid);
    const ownerid = await insert(trx, 'owner', adminid);   
    const modelatorid = await insert(trx, 'moderator', -1);
  });
}
