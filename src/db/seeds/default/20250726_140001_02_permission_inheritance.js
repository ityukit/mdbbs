export function seed(knex) {
  return knex.transaction(async (trx)=>{
    const c = await trx.select('id').from('permission_inheritance').where('id',1).first();
    if(!c){
      console.log(`Inserting permission_inheritance root`);
      await trx('permission_inheritance').insert({
        id: 1,
        name: 'root',
        parent_id: -1,
      });
    }
  });
}

