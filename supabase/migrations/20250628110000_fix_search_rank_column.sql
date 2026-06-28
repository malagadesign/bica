-- Fix: columna "rank" conflictúa con la función agregada rank() de PostgreSQL
-- Error: WITHIN GROUP is required for ordered-set aggregate rank
-- Ejecutar en Supabase SQL Editor después de la migración 1B.

DROP FUNCTION IF EXISTS public.search_ingredients(TEXT, INT);

CREATE OR REPLACE FUNCTION public.search_ingredients(
  query_text TEXT,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  ingredient_id UUID,
  display_name TEXT,
  inci_name TEXT,
  chemical_name TEXT,
  cas_number TEXT,
  color_index TEXT,
  rule_count INT,
  restriction_count INT,
  has_needs_review BOOLEAN,
  rule_statuses TEXT,
  match_field TEXT,
  match_context TEXT,
  relevance_score REAL
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  q_raw TEXT := trim(coalesce(query_text, ''));
  q_norm TEXT := public.normalize_search_text(query_text);
  q_cas TEXT := public.normalize_cas(query_text);
  q_ci TEXT := public.normalize_color_index(query_text);
  q_ci_from_raw TEXT := public.normalize_color_index(q_raw);
  q_expanded TEXT := public.expand_search_terms(q_raw);
  q_tsquery tsquery;
  effective_limit INT := greatest(1, least(coalesce(limit_count, 20), 50));
BEGIN
  IF length(q_raw) < 2 THEN
    RETURN;
  END IF;

  q_tsquery := plainto_tsquery('simple', q_expanded);
  IF q_tsquery IS NULL THEN
    q_tsquery := plainto_tsquery('simple', q_raw);
  END IF;

  RETURN QUERY
  WITH phase1 AS (
    SELECT
      idx.*,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(idx.cas_number) = q_cas THEN 1000
        WHEN q_ci <> '' AND public.normalize_color_index(idx.color_index) = q_ci THEN 900
        WHEN q_ci_from_raw <> ''
             AND public.normalize_color_index(idx.color_index) = q_ci_from_raw THEN 880
        WHEN public.normalize_search_text(idx.inci_name) = q_norm THEN 800
        WHEN idx.inci_name ILIKE q_raw || '%' THEN 700
        WHEN idx.inci_name ILIKE '%' || q_raw || '%' THEN 650
        ELSE 0
      END AS priority_boost,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(idx.cas_number) = q_cas THEN 'cas_number'
        WHEN q_ci <> '' AND public.normalize_color_index(idx.color_index) IN (q_ci, q_ci_from_raw) THEN 'color_index'
        WHEN q_ci_from_raw <> ''
             AND public.normalize_color_index(idx.color_index) = q_ci_from_raw THEN 'color_index'
        WHEN public.normalize_search_text(idx.inci_name) = q_norm THEN 'inci_name'
        WHEN idx.inci_name ILIKE '%' || q_raw || '%' THEN 'inci_name'
        ELSE 'inci_name'
      END AS match_field,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(idx.cas_number) = q_cas THEN idx.cas_number
        WHEN public.normalize_color_index(idx.color_index) IS NOT NULL
             AND public.normalize_color_index(idx.color_index) <> '' THEN 'CI ' || idx.color_index
        WHEN idx.inci_name IS NOT NULL THEN idx.inci_name
        ELSE idx.display_name
      END AS match_context
    FROM public.ingredient_search_index idx
    WHERE
      (q_cas <> '' AND public.normalize_cas(idx.cas_number) = q_cas)
      OR (q_ci_from_raw <> '' AND public.normalize_color_index(idx.color_index) = q_ci_from_raw)
      OR (q_ci <> '' AND public.normalize_color_index(idx.color_index) = q_ci)
      OR public.normalize_search_text(idx.inci_name) = q_norm
      OR idx.inci_name ILIKE q_raw || '%'
      OR idx.inci_name ILIKE '%' || q_raw || '%'
  ),
  phase1_ranked AS (
    SELECT
      p.*,
      (p.priority_boost)::real AS relevance_score
    FROM phase1 p
    WHERE p.priority_boost > 0
    ORDER BY p.priority_boost DESC, p.display_name ASC
    LIMIT effective_limit
  ),
  phase1_ids AS (
    SELECT pr.ingredient_id AS id FROM phase1_ranked pr
  ),
  phase2 AS (
    SELECT
      idx.*,
      CASE
        WHEN idx.chemical_name ILIKE '%' || q_raw || '%' THEN 500
        WHEN idx.synonyms_text ILIKE '%' || q_raw || '%' THEN 450
        WHEN public.search_terms_match_list(idx.list_names, q_expanded) THEN 400
        WHEN idx.list_names ILIKE '%' || q_raw || '%' THEN 380
        WHEN idx.restriction_text ILIKE '%' || q_raw || '%' THEN 350
        ELSE 0
      END AS priority_boost,
      ts_rank(idx.search_vector, q_tsquery) AS fts_rank,
      CASE
        WHEN idx.chemical_name ILIKE '%' || q_raw || '%' THEN 'chemical_name'
        WHEN idx.synonyms_text ILIKE '%' || q_raw || '%' THEN 'synonym'
        WHEN public.search_terms_match_list(idx.list_names, q_expanded)
          OR idx.list_names ILIKE '%' || q_raw || '%' THEN 'list_name'
        WHEN idx.restriction_text ILIKE '%' || q_raw || '%' THEN 'regulatory_text'
        ELSE 'full_text'
      END AS match_field,
      CASE
        WHEN idx.chemical_name ILIKE '%' || q_raw || '%' THEN idx.chemical_name
        WHEN idx.synonyms_text ILIKE '%' || q_raw || '%'
          THEN left(idx.synonyms_text, 120)
        WHEN idx.list_names <> '' THEN left(idx.list_names, 120)
        WHEN idx.restriction_text <> '' THEN left(idx.restriction_text, 120)
        ELSE idx.display_name
      END AS match_context
    FROM public.ingredient_search_index idx
    WHERE idx.ingredient_id NOT IN (SELECT pi.id FROM phase1_ids pi)
      AND (
        (q_tsquery IS NOT NULL AND idx.search_vector @@ q_tsquery)
        OR idx.chemical_name ILIKE '%' || q_raw || '%'
        OR idx.synonyms_text ILIKE '%' || q_raw || '%'
        OR idx.list_names ILIKE '%' || q_raw || '%'
        OR public.search_terms_match_list(idx.list_names, q_expanded)
        OR idx.restriction_text ILIKE '%' || q_raw || '%'
      )
  ),
  phase2_ranked AS (
    SELECT
      p.*,
      (p.priority_boost + (p.fts_rank * 100))::real AS relevance_score
    FROM phase2 p
    WHERE p.priority_boost > 0 OR p.fts_rank > 0
    ORDER BY (p.priority_boost + (p.fts_rank * 100)) DESC, p.display_name ASC
    LIMIT greatest(0, effective_limit - (SELECT count(*) FROM phase1_ranked))
  ),
  combined AS (
    SELECT * FROM phase1_ranked
    UNION ALL
    SELECT
      p2.ingredient_id,
      p2.inci_name,
      p2.chemical_name,
      p2.cas_number,
      p2.color_index,
      p2.einecs,
      p2.synonyms_text,
      p2.rule_count,
      p2.restriction_count,
      p2.has_needs_review,
      p2.rule_statuses,
      p2.list_names,
      p2.restriction_text,
      p2.display_name,
      p2.search_vector,
      p2.priority_boost,
      p2.match_field,
      p2.match_context,
      p2.relevance_score
    FROM phase2_ranked p2
  )
  SELECT
    c.ingredient_id,
    c.display_name,
    c.inci_name,
    c.chemical_name,
    c.cas_number,
    c.color_index,
    c.rule_count,
    c.restriction_count,
    c.has_needs_review,
    c.rule_statuses,
    c.match_field,
    c.match_context,
    c.relevance_score
  FROM combined c
  ORDER BY c.relevance_score DESC, c.display_name ASC
  LIMIT effective_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_ingredients(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_ingredients(TEXT, INT) TO authenticated;
