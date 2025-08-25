import {unified} from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype'
import html from 'rehype-stringify';

import {toHast} from 'mdast-util-to-hast';
import {u} from 'unist-builder';

import init from '../../init.js';

// see https://vivliostyle.github.io/vivliostyle_doc/ja/vivliostyle-user-group-vol2/spring-raining/index.html
function rubyLocator(value, fromIndex){
  return value.indexOf('｜', fromIndex);
}
function rubyTokenizer(eat, value, silent){
  if (value.charAt(0) !== '｜') return;
  const rtStartIndex = value.indexOf('≪');
  const rtEndIndex = value.indexOf('≫');
  if (rtStartIndex === -1 || rtEndIndex === -1) return;
  if (rtStartIndex > rtEndIndex) return;
  const rubyRef = value.slice(1, rtStartIndex);
  const rubyText = value.slice(rtStartIndex + 1, rtEndIndex);
  if (silent) return true;
  const now = eat.now();
  now.column += 1;
  now.offset += 1;
  return eat(value.slice(0, rtEndIndex + 1))({
    type: 'ruby',
    rubyText,
    children: this.tokenizeInline(rubyRef, now),
    data: {hName: 'ruby'},
  });
}
function rubyAttacher(){
  const { Parser } = this;
  if (!Parser) return;
  const {inlineTTokenizers, inlineMethods } = Parser.prototype;
  rubyTokenizer.locator = rubyLocator;
  inlineTTokenizers.ruby = rubyTokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');
}
function rubyHeader(h, node){
  const rtStart = node.children.length > 0 ? node.children[node.children.length - 1].position.end : node.position.start;
  const rtNode = h(
    {
      start: rtStart,
      end: node.position.end,
    },
    'rt',
    [u('text', node.rubyText)],
  );
  return h(node, 'ruby', toHast(h, node.children));
}

class ParserDefault{
  constructor(){
    if (!ParserDefault.instance) {
      this.processor = null;
      this.initialized = false;
      ParserDefault.instance = this;
    }
    return ParserDefault.instance;
  }
  async _init() {
    if (!this.initialized) {
      this.processor = await unified()
                        .use(markdown)
                        .use(rubyAttacher)
                        .use(remark2rehype, {
                          Headers: {ruby: rubyHeader}
                      })
                      .use(html);
      this.initialized = true;
    }
  }
  async parse(text) {
    return await this.processor.process(text);
  }
}

const instance = new ParserDefault();
await instance._init();
export default instance;
