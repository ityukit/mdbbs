import parser from '../../../lib/parser.js';

export default async function parse(app, main, api, subdir, moduleName, settings) {
  // ツリー構造取得処理
  api.post('/contents/parse', async (req, res) => {
    let { content, parser_type } = req.body;
    if (typeof content !== 'string' || content.length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (typeof parser_type !== 'string' || parser_type.length === 0) {
      parser_type = 'default';
    }
    // parse
    const parsed = (await parser.parse(parser_type,content)).value;
    res.json({ contentsparsed: parsed });
  });
  return null;
}
