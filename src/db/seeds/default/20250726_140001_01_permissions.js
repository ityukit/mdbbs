import allpermissions from '../20250726_140001_00_allpermissions.js';
export function seed(knex) {
  return knex.transaction(async (trx)=>{
    for(const perm of allpermissions){
      const c = await trx.select('permission_id').from('permissions').where('permission_id',perm).first();
      if(!c){
        console.log(`Inserting permission ${perm}`);
        await trx('permissions').insert({
          permission_id: perm,
          display_name: `permission.${perm}`,
          description: `permission.${perm}.desc`,
        });
      }
    }
  });
}

