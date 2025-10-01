import init from '../init.js';

const settings = init.getSettings();

let config = {};
config[settings.run_type] = settings.config[settings.config.database.type];

export default config[settings.run_type];
