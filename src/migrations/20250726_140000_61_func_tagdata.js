export function up(knex) {
  return knex.schema.raw(`
  CREATE FUNCTION u_tag_ids(f_thread_id BIGINT)
    RETURNS TEXT AS $$
      BEGIN
        RETURN (select string_agg(tags.tag_id::TEXT, ' > ' order by tags.tag_id) from threads inner join map_thread_tag on threads.id = map_thread_tag.thread_id inner join tags on map_thread_tag.tag_id = tags.id where threads.id = f_thread_id);
      END;
    $$ LANGUAGE plpgsql;

  CREATE FUNCTION u_tag_names(f_thread_id BIGINT)
    RETURNS TEXT AS $$
      BEGIN
        RETURN (select string_agg(tags.display_name::TEXT, ' > ' order by tags.tag_id) from threads inner join map_thread_tag on threads.id = map_thread_tag.thread_id inner join tags on map_thread_tag.tag_id = tags.id where threads.id = f_thread_id);
      END;
    $$ LANGUAGE plpgsql;
    `);
}

export function down(knex) {
  return knex.schema.raw(`
    DROP FUNCTION u_tag_ids(BIGINT);
    DROP FUNCTION u_tag_names(BIGINT);
  `);
}
