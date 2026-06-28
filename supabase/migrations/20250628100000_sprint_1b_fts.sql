-- Sprint 1B — Full Text Search foundation
-- Requiere: 20250626100000_initial_schema.sql + 20250627100000_etapa_1a_core_rules.sql
--
-- Decisiones:
-- - search_vector solo en read model (VIEW), no en tablas fuente
-- - B-Tree para identificadores exactos; FTS para texto libre (fase 2)
-- - Aliases de listas regulatorias para UX ("filtros uv" → Filtros UV)

-- ---------------------------------------------------------------------------
-- Normalización
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_search_text(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(trim(regexp_replace(coalesce(input_text, ''), '\s+', ' ', 'g')));
$$;

CREATE OR REPLACE FUNCTION public.normalize_cas(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT nullif(
    regexp_replace(
      lower(trim(coalesce(input_text, ''))),
      '[^0-9a-z]',
      '',
      'g'
    ),
    ''
  );
$$;

-- Acepta: CI77891, CI 77891, 77891, ci-77891 → 77891
CREATE OR REPLACE FUNCTION public.normalize_color_index(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT nullif(
    regexp_replace(
      regexp_replace(
        lower(trim(coalesce(input_text, ''))),
        '^ci[\s\-]*',
        '',
        'i'
      ),
      '[^0-9a-z]',
      '',
      'g'
    ),
    ''
  );
$$;

-- ---------------------------------------------------------------------------
-- Índices B-Tree para match exacto / prefix
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ingredients_inci_name_lower
  ON public.ingredients (lower(inci_name))
  WHERE inci_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredients_cas_normalized
  ON public.ingredients (public.normalize_cas(cas_number))
  WHERE cas_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredients_ci_normalized
  ON public.ingredients (public.normalize_color_index(color_index))
  WHERE color_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredient_synonyms_synonym_lower
  ON public.ingredient_synonyms (lower(synonym));

-- ---------------------------------------------------------------------------
-- Aliases de búsqueda (listas regulatorias)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.search_term_aliases (
  alias_key    TEXT PRIMARY KEY,
  expand_terms TEXT NOT NULL
);

INSERT INTO public.search_term_aliases (alias_key, expand_terms) VALUES
  ('filtros uv', 'filtros uv filtro uv filtros solares protector solar uv filter uv sunscreen'),
  ('filtro uv', 'filtros uv filtro uv filtros solares protector solar uv filter uv sunscreen'),
  ('protector solar', 'filtros uv filtro uv filtros solares protector solar uv filter uv sunscreen'),
  ('prohibidos', 'prohibidos prohibited'),
  ('conservantes', 'conservantes conservante preservative'),
  ('colorantes', 'colorantes colorante color'),
  ('alérgenos', 'alérgenos alergenos allergen alergenic'),
  ('alergenos', 'alérgenos alergenos allergen alergenic'),
  ('repelentes', 'repelentes repelente repellent')
ON CONFLICT (alias_key) DO UPDATE SET expand_terms = EXCLUDED.expand_terms;

CREATE OR REPLACE FUNCTION public.expand_search_terms(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT a.expand_terms
      FROM public.search_term_aliases a
      WHERE a.alias_key = public.normalize_search_text(input_text)
    ),
    trim(coalesce(input_text, ''))
  );
$$;

CREATE OR REPLACE FUNCTION public.search_terms_match_list(list_names TEXT, expanded_terms TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(string_to_array(coalesce(expanded_terms, ''), ' ')) AS term(raw)
    WHERE length(trim(raw)) >= 2
      AND coalesce(list_names, '') ILIKE '%' || trim(raw) || '%'
  );
$$;

-- ---------------------------------------------------------------------------
-- Read model: ingredient_search_index (VIEW)
-- search_vector calculado aquí, no en tablas fuente
-- ---------------------------------------------------------------------------

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
WHERE i.is_active = true;

COMMENT ON VIEW public.ingredient_search_index IS
  'Read model unificado para búsqueda regulatoria por ingrediente. Sprint 1B.';

-- ---------------------------------------------------------------------------
-- RPC: search_ingredients (2 fases: exacto → FTS)
-- ---------------------------------------------------------------------------

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

-- Aliases: lectura autenticada (mantenimiento futuro vía admin)
ALTER TABLE public.search_term_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_aliases_select_authenticated"
  ON public.search_term_aliases FOR SELECT
  TO authenticated
  USING (true);
