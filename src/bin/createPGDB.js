import Knex from 'knex';
import pg from 'pg';

pg.types.setTypeParser(20, 'text', (a) => {
  const i = parseInt(a, 10);
  return Number.isSafeInteger(i) ? i : NaN;
});

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
        user: {
          type: "string",
          short: "u"
        },
        password: {
          type: "string",
          short: "p"
        },
        rebuild: {
          type: "boolean",
          short: "r",
          default: false
        }
   }
});
//console.log(values); // オプションやフラグを含むオブジェクト
//console.log(positionals); // フラグ以外の引数の配列

if (!values.user || !values.password) {
    console.error("Error: PostgreSQL DB admin user and password is required.");
    console.error("Usage: npm run createPGDB -- --user <DB_ADMIN_USER_ID> --password <DB_ADMIN_PASSWORD> [--rebuild]");
    console.error("  --user or -u: User ID (required)");
    console.error("  --password or -p: Password (required)");
    console.error("  --rebuild or -r: Drop the database if it exists and create a new one (optional)");
    console.error('Example: npm run createPGDB -- --user postgres --password postgres --rebuild');
    process.exit(1);
}


const user = settings.config.postgres.connection.user;
const password = settings.config.postgres.connection.password;
const databaseName = settings.config.postgres.connection.database;
if (!databaseName) {
    console.error("Error: Database name is not specified in the configuration.");
    process.exit(1);
}
if (user === values.user){
    console.error("Error: The admin user must be different from the application database user.");
    process.exit(1);
}

console.log(`Creating PostgreSQL database '${databaseName}' if it does not exist...`);

// 管理者ユーザーで接続するために、データベース名を一時的に削除
settings.config.postgres.connection.user = values.user;
settings.config.postgres.connection.password = values.password;
settings.config.postgres.connection.database = undefined; // 接続時に特定のDBを指定しない
const database = Knex(settings.config[settings.config.database.type]);

if (values.rebuild) {
    console.log(`Rebuilding database '${databaseName}'...`);
    // 既存のデータベースを削除
    await database.raw(`DROP DATABASE IF EXISTS "${databaseName}"`);
    console.log(`Database '${databaseName}' dropped.`);
    // 既存のユーザーを削除
    await database.raw(`DROP USER IF EXISTS "${user}"`);
    console.log(`User '${user}' dropped.`);
}

// ユーザがいなかったらユーザを作成
const chku = await database.raw(`SELECT 1 FROM pg_roles WHERE rolname = '${user}'`);
if (chku.rowCount > 0) {
    console.log(`User '${user}' already exists.`);
} else {
  await database.raw(`CREATE USER "${user}" WITH PASSWORD '${password}'`);
}
console.log(`User '${user}' created.`);

// データベースがなかったらデータベースを作成
const chkd = await database.raw(`SELECT 1 FROM pg_database WHERE datname='${databaseName}'`);
if (chkd.rowCount > 0) {
    console.log(`Database '${databaseName}' already exists.`);
} else {
  await database.raw(`CREATE DATABASE "${databaseName}" WITH OWNER '${user}' template 'template0' ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`);
}
console.log(`Database '${databaseName}' created.`);

console.log('Database setup completed successfully.');
await database.destroy();
process.exit(0);