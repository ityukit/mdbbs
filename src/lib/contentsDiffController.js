import diff from './diff.js';

export default {
  insert: async (contentsId, newTitle, newContents, newParser, newDescription, newUpdatedUserId, trx)=>{
    const current = await trx('contents')
                .select('revision', 'title', 'contents','parser', 'description', 'updated_user_id')
                .where('id', contentsId)
                .first();
    if (current == null) {
      return false;
    }
    const newRevision = current.revision + 1;
    const diffData = await diff.genDiff(current.contents, newContents);

    // write diff
    await trx('contents_diff').insert({
      contents_id: contentsId,
      revision: current.revision,
      title: current.title,
      directed: diffData.patched,
      compressed: diffData.comp,
      diff: diffData.data,
      parser: current.parser,
      description: current.description,
      created_user_id: current.updated_user_id,
    });
    // update contents
    await trx('contents')
          .where('id', contentsId)
          .update({
            title: newTitle,
            revision: newRevision,
            contents: newContents,
            parser: newParser,
            description: newDescription,
            updated_user_id: newUpdatedUserId,
            updated_at: trx.fn.now(6),
          });

    return true;
  }
}
