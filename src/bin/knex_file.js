import init from '../init.js';

const settings = init();

let config = {};
config[settings.run_type] = settings.global[settings.global.database.type];

export default settings.global[settings.global.database.type];
