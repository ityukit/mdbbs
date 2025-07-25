import { createPatch, applyPatch } from 'diff';
import compress from './compress.js';

const split_diff_header = [
"Index: test",
"===================================================================",
"--- test",
"+++ test",
];

export default {
  diffText: async function diffText(oldText, newText) {
    const patches = createPatch('test', oldText, newText,undefined,undefined,{context:0}).split('\n');
    for (let i = 0; i < split_diff_header.length; i++) {
      if (patches[i] !== split_diff_header[i]) {
        return null;
      }
    }
    return patches.slice(split_diff_header.length).join('\n');
  },
  patchText: async function patchText(Text, patches) {
    const patch = split_diff_header.join('\n') + '\n' + patches;
    const pText = applyPatch(Text, patch);
    if (!pText) {
      return null;
    }
    return pText;
  },
  genDiff: async function genDiff(oldText, newText) {
    const d = await this.diffText(oldText, newText);
    if (!d) {
      return null;
    }
    const plainD = Buffer.from(d,'utf8');
    const compNew = await compress.strcomp(newText);
    const compPatch = await compress.strcomp(d);
    let rd = Buffer.from(newText,'utf8');
    let rp = false;
    let rc = false;
    if (plainD.length < rd.length) {
      rd = plainD;
      rp = true;
      rc = false;
    }
    if (compNew.length < rd.length) {
      rd = compNew;
      rp = false;
      rc = true;
    }
    if (compPatch.length < rd.length) {
      rd = compPatch;
      rp = true;
      rc = true;
    }
    return {data: rd, patched: rp, comp: rc};
  },
  extDiff: async function extDiff(Text, diff) {
    let rd = diff.data;
    if (diff.comp) {
      rd = await compress.strdecomp(rd);
      if (!rd) {
        return null;
      }
    } else {
      rd = rd.toString('utf8');
    }
    if (diff.patched) {
      rd = await this.patchText(Text, rd);
      if (!rd) {
        return null;
      }
    }
    return rd;
  },
};

