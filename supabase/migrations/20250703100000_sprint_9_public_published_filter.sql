-- Sprint 9 — Solo contenido publicado en exploración pública (búsqueda FTS)

CREATE OR REPLACE VIEW public.ingredient_search_index AS
WITH synonym_agg AS (
  SELECT
    s.ingredient_id,
    string_agg(DISTINCT s.synonym, ' ' ORDER BY s.synonym) AS synonyms_text
  FROM public.ingredient_synonyms s
  GROUP BY s.ingredient_id
),
rule_agg AS (
  SELECT
    ir.ingredient_id,
    count(DISTINCT ir.id)::int AS rule_count,
    count(DISTINCT r.id)::int AS restriction_count,
    bool_or(ir.needs_review) AS has_needs_review,
    string_agg(DISTINCT ir.rule_status, ' ') AS rule_statuses,
    string_agg(DISTINCT rl.name, ' ' ORDER BY rl.name) AS list_names,
    string_agg(DISTINCT rl.code, ' ') AS list_codes,
    left(
      trim(both ' ' FROM concat_ws(
        ' ',
        string_agg(DISTINCT left(r.limitation_text, 300), ' ')
          FILTER (WHERE r.limitation_text IS NOT NULL AND r.limitation_text <> ''),
        string_agg(DISTINCT left(r.warning_text, 300), ' ')
          FILTER (WHERE r.warning_text IS NOT NULL AND r.warning_text <> ''),
        string_agg(DISTINCT left(r.condition_text, 300), ' ')
          FILTER (WHERE r.condition_text IS NOT NULL AND r.condition_text <> '')
      )),
      2000
    ) AS restriction_text
  FROM public.ingredient_rules ir
  LEFT JOIN public.regulatory_lists rl ON rl.id = ir.list_id
  LEFT JOIN public.restrictions r
    ON r.ingredient_rule_id = ir.id AND r.is_active = true
  WHERE ir.is_active = true
    AND ir.editorial_status = 'published'
  GROUP BY ir.ingredient_id
)
SELECT
  i.id AS ingredient_id,
  i.inci_name,
  i.chemical_name,
  i.cas_number,
  i.color_index,
  i.einecs,
  coalesce(sa.synonyms_text, '') AS synonyms_text,
  coalesce(ra.rule_count, 0) AS rule_count,
  coalesce(ra.restriction_count, 0) AS restriction_count,
  coalesce(ra.has_needs_review, false) AS has_needs_review,
  coalesce(ra.rule_statuses, '') AS rule_statuses,
  coalesce(ra.list_names, '') AS list_names,
  coalesce(ra.restriction_text, '') AS restriction_text,
  coalesce(
    nullif(trim(i.inci_name), ''),
    nullif(trim(i.chemical_name), ''),
    CASE WHEN i.color_index IS NOT NULL THEN 'CI ' || i.color_index END,
    i.cas_number,
    'Sin nombre'
  ) AS display_name,
  (
    setweight(to_tsvector('simple', coalesce(i.inci_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(i.chemical_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(i.cas_number, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(i.color_index, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(i.einecs, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(sa.synonyms_text, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(ra.list_names, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.list_codes, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.restriction_text, '')), 'C')
  ) AS search_vector
FROM public.ingredients i
LEFT JOIN synonym_agg sa ON sa.ingredient_id = i.id
LEFT JOIN rule_agg ra ON ra.ingredient_id = i.id
WHERE i.is_active = true
  AND i.editorial_status = 'published';

COMMENT ON VIEW public.ingredient_search_index IS
  'Read model para búsqueda pública. Solo ingredientes publicados y activos. Sprint 9.';
