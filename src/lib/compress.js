import { Buffer } from 'node:buffer';
import zlib from 'node:zlib';
import { promisify } from 'node:util';

export default {
  strcomp: async function strcomp(text) {
    const v = await this.comp(Buffer.from(text,'utf8'));
    return v;
  },
  strdecomp: async function strdecomp(buffer) {
    const v = await this.decomp(buffer);
    return v.toString('utf8');
  },
  comp: async function comp(text) {
    const v = await promisify(zlib.deflate)(text, {level: 9,finishFlush: zlib.constants.Z_FINISH});
    return v;
  },
  comp64: async function comp64(text) {
    const v = await this.comp(text);
    return v.toString('base64');
  },
  decomp: async function decomp(buffer) {
    const v = await promisify(zlib.inflate)(buffer, {level: 9,finishFlush: zlib.constants.Z_FINISH});
    return v;
  },
  decomp64: async function decomp64(b64) {
    const v = await this.decomp(Buffer.from(b64, 'base64'));
    return v;
  },
};
