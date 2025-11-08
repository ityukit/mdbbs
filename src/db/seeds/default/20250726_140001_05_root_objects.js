import access from "../../../lib/access.js";

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    const c = await trx.select('id').from('resources').where({ target: access.TARGET_TREE, target_id: -1 }).first();
    if(!c){
      console.log(`Inserting tree root object`);
      await access.createResource(trx, access.TARGET_TREE, -1,  access.TARGET_TREE, null,true, false);
    }
  });
}

