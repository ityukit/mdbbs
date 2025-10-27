import access from "../../../lib/access.js";

export function seed(knex) {
  return knex.transaction(async (trx)=>{
    const c = await trx.select('id').from('contexts').where('id',1).first();
    if(!c){
      console.log(`Inserting contexts root`);
      await access.createNewContext(trx, [-1], 'root', true, 1);
    }
  });
}

