import all_actions from '../20250726_140001_00_all_actions.js';
export function seed(knex) {
  return knex.transaction(async (trx)=>{
    for(const action of all_actions){
      const c = await trx.select('id').from('actions').where('action_name',action).first();
      if(!c){
        console.log(`Inserting action ${action}`);
        await trx('actions').insert({
          action_name: action,
          display_name: `action.${action}`,
          description: `action.${action}.desc`,
        });
      }
    }
  });
}

