import dynamicLoader from "./dynamicLoader.js";

class Parser{
  constructor(){
    if (!Parser.instance) {
      this.parsers = {};
      this.initialized = false;
      Parser.instance = this;
    }
    return Parser.instance;
  }
  async _init(){
    if (this.initialized) return;
    await dynamicLoader('./src/lib/parser', async (subdir,moduleName,module) => {
      this.parsers[moduleName] = module.default;
    });
    this.initialized = true;
  }
  async parse(parser, text, id){
    if (this.parsers[parser]) {
      return await this.parsers[parser].parse(text, id);
    }
    return await this.parsers['default'].parse(text, id);
  }
}

const instance = new Parser();
await instance._init();
export default instance;
