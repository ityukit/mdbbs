export function up(knex) {
  return knex.schema.raw(`
  CREATE FUNCTION u_contents_tree_ids(f_contents_id BIGINT)
    RETURNS TEXT AS $$
      DECLARE	
	        v_parent_id BIGINT;
      BEGIN
        IF f_contents_id < 0 THEN
          RETURN '';
        ELSE
          SELECT contents_tree.parent_id INTO STRICT v_parent_id FROM contents_tree WHERE contents_tree.child_id = f_contents_id;
          if v_parent_id < 0 THEN
            RETURN f_contents_id::TEXT;
          END IF;
          RETURN (SELECT concat(ids::TEXT, ' > ', f_contents_id::TEXT) FROM (VALUES(u_contents_tree_ids(v_parent_id))) AS T(ids));
        END IF;
      END;
    $$ LANGUAGE plpgsql;

  CREATE FUNCTION u_contents_list_ids(f_contents_id BIGINT)
    RETURNS TEXT AS $$
      DECLARE	
	        v_parent_id BIGINT;
      BEGIN
        IF f_contents_id < 0 THEN
          RETURN '';
        ELSE
          SELECT contents_list.parent_id INTO STRICT v_parent_id FROM contents_list WHERE contents_list.child_id = f_contents_id;
          if v_parent_id < 0 THEN
            RETURN f_contents_id::TEXT;
          END IF;
          RETURN (SELECT concat(ids::TEXT, ' > ', f_contents_id::TEXT) FROM (VALUES(u_contents_list_ids(v_parent_id))) AS T(ids));
        END IF;
      END;
    $$ LANGUAGE plpgsql;

    CREATE FUNCTION u_contents_list_tree_ids(f_contents_id BIGINT)
    RETURNS TEXT AS $$
      DECLARE  
          v_parent_id BIGINT;
          v_parent_id_str TEXT;
          v_list_ids TEXT;
          v_tree_ids TEXT;
          v_ids TEXT;
          v_loop_last_id_str TEXT;
      BEGIN
        IF f_contents_id < 0 THEN
          RETURN '';
        ELSE
          v_ids := '';
          v_loop_last_id_str := '';
          v_parent_id := f_contents_id;
          LOOP
            IF v_parent_id < 0 THEN
              RETURN v_ids;
            END IF;
            SELECT u_contents_list_ids(v_parent_id) INTO STRICT v_list_ids;
            IF v_list_ids = '' THEN
              RETURN v_ids;
            END IF;
            SELECT split_part(v_list_ids, ' > ', 1) INTO STRICT v_parent_id_str;
            v_parent_id := v_parent_id_str::BIGINT;
            IF v_parent_id < 0  THEN
              RETURN v_list_ids;
            END IF;
            SELECT u_contents_tree_ids(v_parent_id) INTO STRICT v_tree_ids;
            IF v_tree_ids = '' THEN
              RETURN v_ids;
            END IF;
            IF v_ids <> '' THEN
              v_ids := ' > ' || v_ids;
            END IF;
            IF v_loop_last_id_str <> '' THEN
              v_ids := right(v_ids, LENGTH(v_ids) - LENGTH(v_loop_last_id_str) - 3);
            END IF;
            v_ids := v_tree_ids || ' > ' || right(v_list_ids, LENGTH(v_list_ids) - LENGTH(v_parent_id_str) - 3) || v_ids;
            IF v_tree_ids = v_parent_id_str THEN
              RETURN v_ids;
            END IF;
            SELECT split_part(v_ids, ' > ', 1) INTO STRICT v_parent_id_str;
            v_loop_last_id_str := v_parent_id_str;
            v_parent_id := v_parent_id_str::BIGINT;
          END LOOP;
        END IF;
      END;
    $$ LANGUAGE plpgsql;
    `);
}

export function down(knex) {
  return knex.schema.raw(`
    DROP FUNCTION u_contents_tree_ids(BIGINT);
    DROP FUNCTION u_contents_list_ids(BIGINT);
    DROP FUNCTION u_contents_list_tree_ids(BIGINT);
  `);
}
