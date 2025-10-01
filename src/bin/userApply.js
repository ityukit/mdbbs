import database from '../database.js';
import pHash from '../lib/phash.js';


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
        defaultTier: {
          type: "string",
          short: "t",
          default: "owner"
        }
    }
});
//console.log(values); // オプションやフラグを含むオブジェクト
//console.log(positionals); // フラグ以外の引数の配列

if (!values.id) {
    console.error("Error: User ID is required.");
    console.error("Usage: npm run userApply -- --id <user_id> [--name <display_name>] [--password <password>] [--clearPassword] [--defaultTier <tier>]");
    console.error("  --id or -i: User ID (required)");
    console.error("  --name or -n: Display name (optional)");
    console.error("  --password or -p: Password (optional)");
    console.error("  --clearPassword or -c: Clear password (optional)");
    console.error("  --defaultTier or -t: Default tier (optional)");
    console.error('Example: npm run userApply -- --id adm --name "AdminUser" --password "securepassword"');
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

    if (!existingUser) {
      login_id = values.id;
      display_name = values.name ? values.name : values.id; // デフォルトでIDを名前にする
      hashed_password = values.password ? await phash.hashPassword(values.password) : null;
      await trx('users').insert({
        login_id,
        display_name,
        hashed_password,
      });
      id = await trx('users').select('id').where({ login_id: values.id }).first();
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
    }
    await trx.commit();
    console.log("User registration/update successful");
    console.log('User ID:', id);
    console.log('User Login ID:', login_id);
    console.log('User Name:', display_name);
    console.log('User Password:', hashed_password);
    console.log('User Password Clear:', values.clearPassword);
    console.log('User Default Tier:', values.defaultTier);
  } catch (error) {
    console.error("Error registering user:", error);
    await trx.rollback();
  }
});

database.destroy();
