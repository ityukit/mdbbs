import {unified} from 'unified';
import markdown from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax'
import remark2rehype from 'remark-rehype'
import html from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight'

import { visit } from "unist-util-visit";

import {inspect} from 'unist-util-inspect';
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
  const {inlineTokenizers, inlineMethods } = Parser.prototype;
  rubyTokenizer.locator = rubyLocator;
  inlineTokenizers.ruby = rubyTokenizer;
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

class RubyPlugin{
  static RUBY_EXP = /^(.*?)(?:(?:｜|\|)(.+?)《(.+?)》|(?:｜|\|)(.+?)\((.+?)\)|([\u30e0-\u9fcf]+?)《([\u3040-\u309f\u30a0-\u30ff]+?)》|([\u30e0-\u9fcf]+?)\(([\u3040-\u309f\u30a0-\u30ff]+?)\)|(?:｜|\|)(\(.+?\)))/msg;

  static execAll(str){
    let match;
    const result = [];
    while ((match = RubyPlugin.RUBY_EXP.exec(str)) !== null) {
      const bText = match[1];
      //const aText = match[10];
      let isAdd = false;
      if (match[2] !== undefined && match[3] !== undefined) {
        result.push({
          bText: bText,
          rubyText: match[2],
          ruby: match[3],
          //aText: aText,
        });
        isAdd = true;
      }
      if (match[4] !== undefined && match[5] !== undefined) {
        result.push({
          bText: bText,
          rubyText: match[4],
          ruby: match[5],
          //aText: aText,
        });
        isAdd = true;
      }
      if (match[6] !== undefined && match[7] !== undefined) {
        result.push({
          bText: bText,
          rubyText: match[6],
          ruby: match[7],
          //aText: aText,
        });
        isAdd = true;
      }
      if (match[8] !== undefined && match[9] !== undefined) {
        result.push({
          bText: bText,
          rubyText: match[8],
          ruby: match[9],
          //aText: aText,
        });
        isAdd = true;
      }
      if (match[10] !== undefined){
        result.push({
          bText: bText,
          rubyText: match[10],
          ruby: null,
          //aText: aText,
        });
        isAdd = true;
      }
      if (!isAdd){
        result.push({
          bText: bText,
          rubyText: '',
          ruby: null,
          //aText: aText,
        });
      }
    }
    return result;
  }
  static rubyParse(str){
    if (!str) return null;
    const rt = [];
    const exp1 = RubyPlugin.execAll(str);
    if (exp1.length > 0){
      rt.push(...exp1.map(item => ({
        bText: item.bText,
        rubyText: item.rubyText,
        ruby: item.ruby,
        //aText: item.aText,
      })));
    }
    if (rt.length < 1) return null;
    return rt;
  }
  static plugin() {
    return async (tree) => {
      const visitor = (node,index,parent) => {
        const children = [...node.children];
        const ruby = RubyPlugin.rubyParse(children[0].value) || [];
        console.log("ruby:", JSON.stringify(ruby));
        parent.children[index] = {
          type: 'paragraph',
          children: ruby
            .map(r => {
              return {
                type: 'ruby',
                properties: {
                  bText: r.bText,
                  rubyText: r.rubyText,
                  ruby: r.ruby,
                  //aText: r.aText
                },
                children: [],
              };
          }),
        };
        console.log(JSON.stringify(parent.children[index]));
      };
      visit(tree, RubyPlugin.isRuby, visitor);
    };
  }
  static isRuby(node){
    if (!RubyPlugin.isTextParagraph(node)) return false;
    return RubyPlugin.isRubyParagraph(node);
  }
  static isTextParagraph(node) {
    return (
      node.type == "paragraph" &&
      node.children &&
      node.children[0].type === "text" &&
      node.children.length === 1
    );
  }
  static isRubyParagraph(node) {
    const r = RubyPlugin.rubyParse(node.children[0].value);
    if (r === null) return false;
    //if (r.length < 1) return false;
    //if (r.length === 1 && r[0].ruby === null) return false;
    //for(let v of r){
    //  if (!v.ruby) return false;
    //}
    return true;
  }

  static rehypeHandler(h, node){
    const bText = node.properties.bText;
    const ruby = node.properties.ruby;
    const rubyText = node.properties.rubyText;
    //const aText = node.properties.aText;
    if (ruby === null){
      return [{
        type: "text",
        value: bText + rubyText,// + aText,
      }];
    }
    let r = [];
    if (bText){
      r.push({
        type: "text",
        value: bText,
      });
      console.log("bText:", bText);
    }
    r.push(
        {
          type: "element",
          tagName: "ruby",
          properties: {
            className: ["ruby-container"],
          },
          children: [
            {
              type: "element",
              tagName: "rb",
              properties: {
                className: ["ruby-text"],
              },
              children: [
                {
                  type: "text",
                  value: rubyText,
                },
              ],
            },
            {
              type: "element",
              tagName: "rp",
              properties: {
                className: ["ruby-start"],
              },
              children: [
                {
                  type: "text",
                  value: "《",
                },
              ],
            },
            {
              type: "element",
              tagName: "rt",
              properties: {
                className: ["ruby-text"],
              },
              children: [
                {
                  type: "text",
                  value: ruby,
                },
              ],
            },
            {
              type: "element",
              tagName: "rp",
              properties: {
                className: ["ruby-start"],
              },
              children: [
                {
                  type: "text",
                  value: "》",
                },
              ],
            },
          ],
        },
      );
    //if (aText){
    //  r.push({
    //    type: "text",
    //    value: aText,
    //  });
    //}
    return r;
  }
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
                        .use(markdown,{fragment: true})
                        .use(remarkGfm)
                        .use(remarkMath)
                        //.use(remarkRuby)
                        //.use(rubyAttacher)
                        .use(RubyPlugin.plugin)
                        .use(remark2rehype, {
                        //  Headers: {ruby: rubyHeader}
                          handlers: {ruby: RubyPlugin.rehypeHandler}
                        })
                        .use(rehypeMathjax)
                        .use(rehypeHighlight)
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
const processor = instance.processor;
var input = "とりあえず｜これはルビです《ルビテキスト》";
input=`
あああ
｜禁書目録一《インデックスいち》
|禁書目録二《インデックスに》
｜禁書目録三(インデックスさん)
|禁書目録四(インデックスし)
禁書目録五(インデックスご)
禁書目録六|(インデックスろく)
いいい
`
//
const parsed = await processor.parse(input);
console.log(JSON.parse(JSON.stringify(inspect(parsed))));
const transformed = await processor.run(parsed);
console.log(JSON.parse(JSON.stringify(inspect(transformed))));
console.log(await processor.process(input));
console.log(processor.stringify(transformed));
console.log(await instance.parse(input));

export default instance;
