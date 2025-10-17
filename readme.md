# ityukit-memo

## 重要な注意

* version 1.0まではスキーマは破壊的に変更されます
* version 1.0までのバージョンアップはdrop db & create dbが基本です
  * 何を言っているのかというと、バージョンアップ時にデータの保存がされないケースが多いです

## インストールに必須なもの

* nodejs
* PostgreSQL

### あると速くなるかもしれないもの(必須ではない)

* redis

## コンフィグ設定

* オーバーライド用ディレクトリ作成

```
mkdir .config
mkdir .env
```

* 以下、production(本番)環境用ファイルと仮定。開発環境の場合はproductionをdevelopmentと読み替えること
* production環境、development環境両方の記載がある場合、使う方だけ実行すれば良い
* .envのPASSWORD_HASHING_○○_KEY、yamlのModules.UserManager:HASHING_○○_KEYの値は、一度設定したら変更しないこと（変更すると全ユーザがログインできなくなります）
* 間違って消えると、全ユーザがログインできなくなるため、どこかに保存しておいた方が良いかも。

### `.config/production.yaml`設定

* `src/default/config/production.yaml`を見て、書き換えたい内容だけを、同じ構造で `.config/production.yaml`に記載
* 必須そうなのは以下
```
global:
  app:
    # システムのポート番号
    port: 3000
    # URLのホスト名の後の部分
    urlBase: /mdbbs
    # システムの名前
    name: MDBBS
    # 管理者名
    author: Ituki Kirihara/NI
  postgres:
    connection:
      # PostgreSQLのホスト名
      host: '127.0.0.1'
      # PostgreSQLのポート番号
      port: 5432
      # PostgreSQLのDB名
      database: 'mdbbs'
      # PostgreSQLのユーザ名
      user: 'mdbbs_user'
      # PostgreSQLのパスワード
      password: 'mdbbs_password'
```

* redisを使う場合は、以下も追加を推奨
```
global:
  session:
    # セッション管理にredisを利用
    type: 'redis'
  cache:
    # キャッシュ管理にredisを利用
    type: 'redis'
  redis:
    # Redisのホスト名
    host: '127.0.0.1'
    # Redisのポート番号
    port: 6379
    # RedisのDB番号
    db: 0
    # Redisのパスワード
    password: ''
```


###  `.env/production`に、環境変数を追加
* 現在有効なのは以下。
* どっちも適当な文字列でいいです。
* 変更するとパスワードが復元できなくなりますので、バックアップ対象です
```
PASSWORD_HASHING_SUGAR_KEY=システム固有の乱数文字列１を設定
PASSWORD_HASHING_PEPPER_KEY=システム固有の乱数文字列２を設定
```

## インストール

```
npm install
```

## PostgreSQLを使っている場合は、以下のコマンドでDB作成
* PostgreSQL以外は現在未サポート
* **上記で設定したpostgres用のユーザ・databaseを破壊して作り直すので注意**

* production環境(.config/production.yaml)
```
npm run createPGDB -- --user PostgreSQLの管理ユーザ --password PostgreSQLの管理ユーザのパスワード --rebuild
```

* development環境(.config/development.yaml)
```
npm run dev:createPGDB -- --user PostgreSQLの管理ユーザ --password PostgreSQLの管理ユーザのパスワード --rebuild
```

* もし、管理ユーザのパスワードが設定されていない場合は、psqlで以下を実行
```
drop database if exist *DB_NAME*
drop user if exist *DB_USERNAME*
create user *DB_USERNAME* with password '*DB_PASSWORD*';
create database *DB_NAME* with owner *DB_USERNAME* template 'template0' ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';
```
* 本番環境では、管理ユーザのパスワード無し（ログインのためには管理ユーザが必要）を推奨しますが、開発とかでパスワードを付けたい場合は以下を実行
```
alter role **PostgreSQL管理ユーザ** with password '**PostgreSQL管理ユーザパスワード**';
```
* 逆に、パスワードを消したい場合は、以下を実行
```
ALTER ROLE **PostgreSQL管理ユーザ** WITH PASSWORD NULL;
```

## データベース初期化
* システムに必要なテーブル・初期データを作成

* production環境
```
npm run build:db
```

* development環境
```
npm run dev:build:db
```

## 初期ユーザ追加
* 管理用ユーザを追加

* production環境
```
npm run userApply -- --id ログインID --name "ユーザの名前" --password "ログインパスワード"
```

* development環境
```
npm run dev:userApply -- --id ログインID --name "ユーザの名前" --password "ログインパスワード"
```

## 実行

* システム開始

* production環境
```
npm run start
```

* development環境
```
npm run dev:start
```

## 実行終了

* Ctrl + Cとかで止めてください

## バージョンアップ時(予定)
* コマンド実行前に、システム停止させること
* コマンド実行後にシステム開始させること

* production環境
```
npm run build:migrate
```

* development環境
```
npm run dev:build:migrate
```

# old memo

## init db

```
create user *DB_USERNAME* with password '*DB_PASSWORD*';
create database *DB_NAME* with owner *DB_USERNAME* template 'template0' ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';
```

## install

```
npm instll
npm run build:migrate
```

## start

```
npm start
```

## for development

```
npm run dev
```

### logmessage over warn

```
LOG_LOGLEVEL='warn' npm run dev
```

### logmessage trace on module

```
MODULE_LOG=/lib/example npm run dev
```

### logmessage over warn, trace on module

```
LOG_LOGLEVEL='warn' MODULE_LOG=/lib/example npm run dev
```
