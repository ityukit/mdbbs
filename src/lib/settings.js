import _ from 'lodash';
import i18n from 'i18n';
import yaml from 'yaml';
import fs from 'fs';
import * as dateutil from 'date-fns';
import * as datelocale from 'date-fns/locale';
import * as dateformat from 'date-format';

function config_override(target, override) {
  if (override === undefined) {
    return _.cloneDeep(target);
  }
  if (override === null) {
    if (target === undefined || target === null) {
      return null;
    }
    return _.cloneDeep(target);
  }
  if (!_.isPlainObject(override)) {
    return _.cloneDeep(override);
  }
  // oveerride is a plain object
  if (target === undefined || target === null) {
    return _.cloneDeep(override);
  }
  if (!_.isPlainObject(target)) {
    return _.cloneDeep(override);
  }
  // target is a plain object
  if (Object.keys(override).length === 0) {
    return _.cloneDeep(target);
  }
  // override is not empty
  if (Object.keys(target).length === 0) {
    return _.cloneDeep(override);
  }
  // target is not empty
  let tg = _.cloneDeep(target);
  for (const k of Object.keys(override)) {
    tg[k] = config_override(tg[k], override[k]);
  }
  return tg;
}

export default function setting(env, home, defaultconfig, config) {
  const r = {
    home,
    run_type: env,
    config: {
    },
    module_config: {
    },
    password: {
    },
    i18n: null,
    dateutil,
    datelocale,
    dateformat,
    datetool:{
      format : (date) => dateutil.format(date, "yyyy-MM-dd HH:mm:ss.SSSxxx"),
      distance : (date) => dateutil.formatDistanceToNow(date, {includeSeconds: true, locale: datelocale[i18n.getLocale()]}),
      parse: (dateString) => {
        { const a = dateutil.parseISO(dateString); if (a instanceof Date && !isNaN(a)) return a; }
        { const a = dateutil.parse(dateString); if (a instanceof Date && !isNaN(a)) return a; }
        { const a = Date.parse(dateString); if (a instanceof Date && !isNaN(a)) return a; }
        return null;
      }
    },
    extra:{
      function: {
        config_override,
        _,
      },
      config:{
        default: defaultconfig,
        override: config,
      },
    }
  };
  if (config?.global === undefined) {
    for (const k of Object.keys(defaultconfig.global)) {
      r.config[k] = config_override(defaultconfig.global[k]);
    }
  }else{
    for (const k of Object.keys(defaultconfig.global)) {
      r.config[k] = config_override(defaultconfig.global[k], config.global[k]);
    }
  }
  if (config?.Modules === undefined) {
    for (const k of Object.keys(defaultconfig.Modules)) {
      r.module_config[k] = config_override(defaultconfig.Modules[k]);
    }
  }else{
    for (const k of Object.keys(defaultconfig.Modules)) {
      r.module_config[k] = config_override(defaultconfig.Modules[k], config.Modules[k]);
    }
  }
  r.password.rounds = config_override(defaultconfig.Modules.UserManager.BCRYPT_SALT_ROUNDS, config.Modules?.UserManager?.BCRYPT_SALT_ROUNDS);
  r.password.sugar = "ou)_)Htvcw769nimwjow7800ij" +
    (config_override(defaultconfig.Modules.UserManager.HASHING_SUGAR_KEY, config.Modules?.UserManager?.HASHING_SUGAR_KEY) || '') +
    (process.env.PASSWORD_HASHING_SUGAR_KEY || '') +
    '0ihnr$R^T&NGR';
  r.password.pepper = "9um8d6fr6ty78u9ikjihv5r67U(HW(*U0;HUGGbgy8u9iojhbgyu" +
    (config_override(defaultconfig.Modules.UserManager.HASHING_PEPPER_KEY, config.Modules?.UserManager?.HASHING_PEPPER_KEY) || '') +
    (process.env.PASSWORD_HASHING_PEPPER_KEY || '') +
    '(96ted90pYGR%@UJUWUH^TH8k92jwyji6fgh79ki iu9ko)';
  const locales = [];
  let defaultLocale = null;
  for (const n of fs.readdirSync(home + './src/locales')) {
    const m = n.match(/^([a-zA-Z_]+).yaml$/);
    if (m){
      const l = m[1];
      if (defaultLocale === null) {
        defaultLocale = l;
      }
      if (defaultLocale !== 'ja' && l === 'en') {
        defaultLocale = l;
      }
      if (l === 'ja') {
        defaultLocale = l;
      }
      locales.push(l);
    }
  }
  i18n.configure({
    locales,
    defaultLocale,
    cookie: 'locales',
    queryParameter: 'lang',
    directory: home + './src/locales',
    objectNotation: true,
    extension: '.yaml',
    parser: yaml
  });
  i18n.setLocale(defaultLocale);
  r.i18n = i18n;

  return r;
}
