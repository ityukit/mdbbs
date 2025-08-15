import process from 'process';
import os, { type } from 'os';
import log4js from 'log4js';
import dateFormat from 'date-format';
import chalk from 'chalk';

import util from 'node:util';
import fs from 'fs';

import init from './init.js';

//import path from 'node:path';
//import { console } from 'inspector';

const levelColors = {
  TRACE: { meta: 'grey', body: 'grey', trace: null },
  DEBUG: { meta: 'green', body: 'grey', trace: null },
  INFO: { meta: 'cyan', body: 'white', trace: null },
  WARN: { meta: 'yellow', body: 'yellow', trace: null },
  ERROR: { meta: 'red', body: 'red', trace: 'white' },
  FATAL: { meta: 'magenta', body: 'magenta', trace: 'white' },
};

const coloring = function coloring(color, text) {
  if (color) {
    return chalk[color](text);
  }
  return text;
};

export function moduleNameGenerator(filepath) {
  let module = ':default';
  if (filepath !== undefined && filepath !== null) {
    module = filepath;
    if (filepath.startsWith(':')) {
      // do nothing
    } else {
      module = filepath;
      if (module.endsWith('.js')) {
        module = module.substring(0, module.length - 3);
      }
      if (module.endsWith('.mjs')) {
        module = module.substring(0, module.length - 4);
      }
      if (module.endsWith('.cjs')) {
        module = module.substring(0, module.length - 4);
      }
      while (module.startsWith('/')) {
        module = module.substring(1);
      }
      module = `/${module}`;
    }
  }
  //if (classname !== undefined && classname !== null) {
  //  if (classname !== '') {
  //    const classbase = classname.split('.')[0];
  //    module = `${module} ${classbase}`;
  //  }
  //}
  return module;
}

export function moduleFilepathGenerator(lv) {
  let filepath = '';
  lv += 1;
  const callSites = util.getCallSites();
  if (callSites !== undefined && callSites !== null) {
    if (callSites.length > lv) {
      filepath = callSites[lv].scriptName;
      const cpwd = process.cwd();
      const fpaths = filepath.split(cpwd);
      fpaths.shift();
      filepath = fpaths.join(cpwd);
      if (filepath.startsWith('/src/')) {
        filepath = filepath.substring('/src/'.length);
      }
    }
  }
  return filepath;;
}

export default function logger(gconfig, objectName) {
  if (gconfig === undefined || gconfig === null) {
    gconfig = {};
  }
  let filepath = moduleFilepathGenerator(1);
  let module = moduleNameGenerator(filepath);

  let config = {};
  if (gconfig.config.logger !== undefined && gconfig.config.logger !== null) {
    config = gconfig.config.logger;
  }

  let caller_name = '';
  if (objectName !== undefined && objectName !== null) {
    if (typeof objectName === 'string') {
      caller_name = objectName;
    } else if (objectName.constructor !== undefined && objectName.constructor !== null) {
      caller_name = objectName.name;
    } else {
      caller_name = objectName.constructor.name;
    }
    //module = `${caller_name}`;
  }
  if (caller_name !== '') {
    module = `${module}|${caller_name}`;
  }

  log4js.addLayout('origin', function layout({ addColor }) {
    return function formatter(e) {
      const date = new Date(e.startTime);
      const level = e.level.levelStr.toUpperCase(); // 大文字
      const hasCallStack = Object.prototype.hasOwnProperty.call(e, 'callStack'); // callStack を持っているか
      const module = e.categoryName;

      // 関数名
      let modulename = module;
      let caller_name = '';
      if (module.indexOf('|') !== -1) {
        const tokens = module.split('|');
        modulename = tokens[0];
        caller_name = tokens[1];
      }
      let funcname = '';
      if (hasCallStack) {
        const { callStack } = e;
        const line = callStack.split('at ')[1].trim();
        const funcs = line.split(' ');
        let func = funcs[0];
        if (funcs.length == 1) {
          func = '(base:' + filepath + ')';
        }
        
        const flines = line.split(' ').pop().split(':');
        const fline = flines[flines.length - 2];
        if (caller_name !== '') {
          if (func.startsWith('Object.')) {
            func = func.substring('Object.'.length);
            func = `${caller_name}.${func}`;
          }
        }
        funcname = ` ${func}`;
        modulename = `${modulename}:${fline}`;
      }

      const dateStr = dateFormat('yyyy-MM-dd hh:mm:ss.SSS', date);
      const message = e.data.join(' '); // データはスペース区切り
      const levelStr = level.padEnd(5).slice(0, 5); // 5文字
      const pid = e.pid.toString();
      const color = levelColors[level];

      // メタ情報
      const meta = `${dateStr} ${levelStr} [${modulename}]${funcname} pid=${pid}`;
      const prefix = addColor ? coloring(color.meta, meta) : meta;

      // ログ本体
      const body = addColor ? coloring(color.body, message) : message;

      // スタックトレース
      let suffix = '';
      if (hasCallStack && color.trace) {
        const { callStack } = e;
        suffix += os.EOL;
        suffix += addColor ? coloring(color.trace, callStack) : callStack;
      }

      return `${prefix} ${body}${suffix}`;
    };
  });

  let outloglevel = config.loglevel || 'info';
  if (process.env.MODULE_LOG !== undefined && process.env.MODULE_LOG !== null) {
    outloglevel = 'info';
  }
  if (process.env.NODE_ENV === 'production') {
    outloglevel = 'info';
  }
  if (process.env.LOG_LOGLEVEL !== undefined && process.env.LOG_LOGLEVEL !== null) {
    outloglevel = process.env.LOG_LOGLEVEL;
  }
  if (process.env.MODULE_LOG !== undefined && process.env.MODULE_LOG !== null) {
    const debug = process.env.MODULE_LOG;
    if (module.match(new RegExp(debug)) !== null) {
      outloglevel = 'trace';
    }
  }

  const conflog4js = {
    appenders: {},
    categories: {},
  };
  const mod_appes = [];
  for (const k of (config.transports || [])) {
    if (k.type === 'console') {
      conflog4js.appenders.out = { type: 'stdout', layout: { type: 'origin', addColor: true } };
      mod_appes.push('out');
    } else if (k.type === 'file') {
      conflog4js.appenders.logFile = {
        type: 'file',
        filename: `${gconfig.home}/../logs/${k.filename}`,
        layout: { type: 'origin', addColor: false },
        maxLogSize: k.maxSize || '1M',
        backups: k.maxCount || 1,
      };
      conflog4js.appenders.log = {
        type: 'logLevelFilter',
        appender: 'logFile',
        level: process.env.LOG_FILE_LOGLEVEL || k.loglevel || 'info',
      };
      mod_appes.push('log');
    }
  }

  conflog4js.categories[module] = {
    appenders: mod_appes,
    level: outloglevel,
    enableCallStack: true,
  };
  conflog4js.categories.default = conflog4js.categories[module];
  log4js.configure(conflog4js);
  const r = log4js.getLogger(module);
  r.end = function end() {
    log4js.shutdown(() => {});
  };
  return r;
}
