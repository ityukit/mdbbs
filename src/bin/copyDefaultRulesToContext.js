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
      contextId: {
        type: "string",
        short: "c",
      }
    }
});
//console.log(values); // オプションやフラグを含むオブジェクト
//console.log(positionals); // フラグ以外の引数の配列

if (!values.contextId || utils.parseSafeInt(values.contextId) < 1) {
    console.error("Error: Context ID is required.");
    console.error("Usage: npm run copyDefaultRulesToContext -- --contextId <context_id>");
    console.error("  --contextId or -c: Context ID (required)");
    console.error('Example: npm run copyDefaultRulesToContext -- --contextId 1');
    process.exit(1);
}

const phash = new pHash(settings);

await database.transaction(async (trx) => {
  try {
    await access.copyDefaultRulesToContext(trx, utils.parseSafeInt(values.contextId));
    await trx.commit();
    console.log(`Default rules copied to context ID ${values.contextId} successfully.`);
  } catch (error) {
    console.error("Error copying default rules to context:", error);
    await trx.rollback();
    process.exit(1);
  }
});

database.destroy();
process.exit(0);
