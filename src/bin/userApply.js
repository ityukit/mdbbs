import database from '../database.js';
import pHash from '../lib/phash.js';
import access from '../lib/access.js';
import utils from '../lib/utils.js';

import init from '../init.js';
const settings = init.getSettings();

// `node:util`モジュールを、utilオブジェクトとしてインポートする
import * as util from "node:util";

// コマンドライン引数をparseArgs関数でパースする
const {
    values,
    positionals
} = util.parseArgs({
    // オプションやフラグ以外の引数を渡すことを許可する
    allowPositionals: false,
    options: {
        // オプションのデフォルト値を設定する
        id: {
          type: "string",
          short: "i"
        },
        name: {
          type: "string",
          short: "n"
        },
        password: {
          type: "string",
          short: "p"
        },
        clearPassword: {
          type: "boolean",
          short: "c"
        },
        tier: {
          type: "string",
          short: "t",
          default: "owner"
        },
        setEnabled: {
          type: "string",
          short: "e",
          default: 'true'
        },
        contextIds: {
          type: "string",
          short: "c",
          default: "1"
        }
    }
});
//console.log(values); // オプションやフラグを含むオブジェクト
//console.log(positionals); // フラグ以外の引数の配列

if (!values.id) {
    console.error("Error: User ID is required.");
    console.error("Usage: npm run userApply -- --id <user_id> [--name <display_name>] [--password <password>] [--clearPassword] [--tier <tier>,...] [--setEnabled <true|false>] [--contextIds <context_id>,...]");
    console.error("  --id or -i: User ID (required)");
    console.error("  --name or -n: Display name (optional)");
    console.error("  --password or -p: Password (optional)");
    console.error("  --clearPassword or -c: Clear password (optional)");
    console.error("  --tier or -t: set tier (optional) default: owner");
    console.error("  --setEnabled or -e: set enabled (optional) default: true");
    console.error("  --contextIds or -c: set context IDs (optional) default: 1");
    console.error('Example: npm run userApply -- --id adm --name "AdminUser" --password "securepassword" --tier "owner,admin" --setEnabled true --contextIds "1,2"');
    process.exit(1);
}

const phash = new pHash(settings);

await database.transaction(async (trx) => {
  try {
    const existingUser = await trx('users').select('id','login_id','display_name','hashed_password').where({ login_id: values.id }).first();
    let id = null;
    let login_id = null;
    let display_name = null;
    let hashed_password = null;
    let enabled = (values.setEnabled.toLowerCase() === 'true') ? true : false;
    let contextIds = values.contextIds.split(',').map((v) => utils.parseSafeInt(v.trim())).filter((v) => v  > 0);

    if (!existingUser) {
      login_id = values.id;
      display_name = values.name ? values.name : values.id; // デフォルトでIDを名前にする
      hashed_password = values.password ? await phash.hashPassword(values.password) : null;
      await trx('users').insert({
        login_id,
        display_name,
        hashed_password,
        enabled,
      });
      id = (await trx('users').select('id').where({ login_id: values.id }).first()).id;
    }else{
      id = existingUser.id;
      login_id = existingUser.login_id;
      display_name = existingUser.display_name;
      hashed_password = existingUser.hashed_password;
      if (values.name){
        display_name = values.name;
        await trx('users').update({
          display_name,
        }).where({ id });
      }
      if (values.password) {
        hashed_password = await phash.hashPassword(values.password);
        await trx('users').update({
          hashed_password
        }).where({ id });
      }
      if (values.clearPassword) {
        await trx('users').update({
          hashed_password: null,
        }).where({ id });
        hashed_password = null;
      }
      await trx('users').update({
        enabled,
      }).where({ id });
    }
    if (values.tier) {
      // delete all tiers in context 1
      const userTiers = await access.getTierIdsByUser(trx, id, contextIds);
      for(const ut of userTiers){
        const tn = await access.getTierNameById(trx, ut);
        for(const cid of contextIds){
          await access.removeTier_User(trx, id, ut, cid);
        }
        console.log(`User removed from tier ${tn}(id:${ut}) (context ${contextIds.join(',')})`);
      }
      // add tiers
      for(const tierName of values.tier.split(',')){
        const tierid = await access.getTierIdByName(trx, tierName);
        if(!tierid){
          throw new Error(`Tier not found: ${tierName}`);
        }
        for(const cid of contextIds){
          if (!await access.checkUserInTier(trx, id, tierid,[cid])){
            await access.addTier_User(trx, id, tierid, cid);
            console.log(`User added to tier ${tierName} (context ${cid})`);
          }else{
            console.log(`User already in tier ${tierName} (context ${cid})`);
          }
        }
      }
   }
    await trx.commit();
    console.log("User registration/update successful");
    console.log('User ID:', id);
    console.log('User Login ID:', login_id);
    console.log('User Name:', display_name);
    console.log('User Password:', hashed_password);
    console.log('User Password Clear:', values.clearPassword ? true : false);
    console.log('User Tier add:', values.tier);
    console.log('User Enabled:', enabled);
    console.log('User Context IDs:', contextIds.join(','));
  } catch (error) {
    console.error("Error registering user:", error);
    await trx.rollback();
    process.exit(1);
  }
});

database.destroy();
process.exit(0);
