import permissions from "../../../lib/permissions.js";

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    const c = await trx.select('id').from('permission_inheritance').where('id',1).first();
    if(!c){
      console.log(`Inserting permission_inheritance root`);
      await permissions.createNewInheritance(trx, -1, 'root', true, 1);
    }
  });
}

