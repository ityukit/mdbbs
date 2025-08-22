export function up(knex) {
  return knex.schema.raw(`
  CREATE FUNCTION u_dir_ids(f_dir_id BIGINT)
    RETURNS TEXT AS $$
      DECLARE	
	        v_parent_id BIGINT;
          v_dir_name TEXT;
      BEGIN
        IF f_dir_id = -1 THEN
          RETURN '';
        ELSE
          SELECT dirtree.parent_id, dirs.dir_id INTO STRICT v_parent_id, v_dir_name from dirtree inner join dirs on dirtree.child_id = dirs.id WHERE dirtree.child_id = f_dir_id;
          if v_parent_id = -1 THEN
            RETURN v_dir_name;
          END IF;
          RETURN (SELECT concat(ids::TEXT, ' > ', v_dir_name) FROM (VALUES(u_dir_ids(v_parent_id))) AS T(ids));
        END IF;
      END;
    $$ LANGUAGE plpgsql;

    CREATE FUNCTION u_dir_names(f_dir_id BIGINT)
    RETURNS TEXT AS $$
      DECLARE	
	        v_parent_id BIGINT;
          v_dir_name TEXT;
      BEGIN
        IF f_dir_id = -1 THEN
          RETURN '';
        ELSE
          SELECT dirtree.parent_id, dirs.display_name INTO STRICT v_parent_id, v_dir_name from dirtree inner join dirs on dirtree.child_id = dirs.id WHERE dirtree.child_id = f_dir_id;
          if v_parent_id = -1 THEN
            RETURN v_dir_name;
          END IF;
          RETURN (SELECT concat(ids::TEXT, ' > ', v_dir_name) FROM (VALUES(u_dir_names(v_parent_id))) AS T(ids));
        END IF;
      END;
    $$ LANGUAGE plpgsql;
    `);
}

export function down(knex) {
  return knex.schema.raw(`
    DROP FUNCTION u_dir_ids(BIGINT);
    DROP FUNCTION u_dir_names(BIGINT);
  `);
}
