import _ from 'lodash';

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
  for (const k of Object.keys(defaultconfig.global)) {
    r.config[k] = config_override(defaultconfig.global[k], config.global[k]);
  }
  for (const k of Object.keys(defaultconfig.Modules)) {
    r.module_config[k] = config_override(defaultconfig.Modules[k], config.Modules[k]);
  }
  r.password.sugar = "ou)_)Htvcw769nimwjow7800ij" +
    (config_override(defaultconfig.Modules.UserManager.HASHING_SUGAR_KEY, config.Modules?.UserManager?.HASHING_SUGAR_KEY) || '') +
    (process.env.PASSWORD_HASHING_SUGAR_KEY || '') +
    '0ihnr$R^T&NGR';

  return r;
}
