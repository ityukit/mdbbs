
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
    const guestid = await insert(trx, 'guest', -1);
    const userid = await insert(trx, 'user', -1);
    const poweruserid = await insert(trx, 'poweruser', userid);
    const adminid = await insert(trx, 'admin', poweruserid);
    const ownerid = await insert(trx, 'owner', adminid);
    const modelatorid = await insert(trx, 'moderator', -1);
  });
}
