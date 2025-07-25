# ityukit-memo

## init db

```
create user *DB_USERNAME* with password '*DB_PASSWORD*';
create database *DB_NAME* with owner *DB_USERNAME*;
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

## for debug

```
npm run debug
```

### logmessage over warn

```
LOG_LOGLEVEL='warn' npm run debug
```

### logmessage trace on module

```
MODULE_LOG=/lib/example npm run debug
```

### logmessage over warn, trace on module

```
LOG_LOGLEVEL='warn' MODULE_LOG=/lib/example npm run debug
```
