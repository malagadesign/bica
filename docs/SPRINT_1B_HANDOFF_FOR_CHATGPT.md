# Cosing AR — Sprint 1B (FTS) Handoff para ChatGPT

**Uso:** Copiar este archivo completo en ChatGPT. Pedir revisión, refinamiento o implementación guiada. Completar la sección **10. Respuesta para Cursor** al final y pegarla de vuelta en Cursor.

**Fecha:** 26 de junio de 2026  
**Estado del proyecto:** Etapa 1A completada. Sprint 1A (UX de búsqueda) completado. Sprint 1B propuesto, **pendiente de confirmación e implementación**.

---

## 1. Instrucciones para ChatGPT

Actuá como **arquitecto backend + search engineer + product owner técnico** del proyecto Cosing AR.

Tu tarea:

1. Revisar la propuesta de **Sprint 1B — Search Foundation / Full Text Search**.
2. Verificar alineación con `docs/ARCHITECTURE_FREEZE.md` (contrato congelado).
3. Validar la migración SQL, la VIEW, la RPC y el ranking propuestos.
4. Detectar riesgos de performance, seguridad (RLS), o sobre-ingeniería.
5. Responder **cada pregunta de la sección 9** con decisión explícita.
6. Indicar si la propuesta está **APROBADA PARA IMPLEMENTAR**, **APROBADA CON CAMBIOS** o **RECHAZADA**.
7. Completar la plantilla de respuesta de la **sección 10** para que el equipo la pegue en Cursor.

**Restricciones del proyecto (no negociables):**

- Stack: Next.js 15 + TypeScript + Supabase + PostgreSQL + Tailwind 4 + shadcn/ui.
- No Prisma. No OpenAI. No embeddings. No chat. No IA generativa.
- No tocar el legacy Laravel (`cosing-ar/` en otro directorio).
- No implementar aún: filtros avanzados, comparador, exportación, pagos, edición, importador transaccional (Etapa 2).
- La búsqueda no debe exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.
- Las consultas deben pasar por Server Action / RPC, no Supabase directo desde componentes client.
- `needs_review` debe seguir siendo visible y filtrable.
- Relación central: `Ingredient → IngredientRule → Restriction`.

---

## 2. Contexto del proyecto

**Cosing AR** es una plataforma SaaS regulatoria para consulta de ingredientes cosméticos (MERCOSUR/ANMAT/UE, etc.).

| Capa | Rol |
|------|-----|
| Documento normativo oficial | Fuente legal |
| CSV normalizado del cliente | Fuente operativa de carga |
| PostgreSQL (Supabase) | Fuente de consulta en runtime |

**Repo activo:** `cosing-ar-next/`  
**Contrato arquitectónico:** `docs/ARCHITECTURE_FREEZE.md` v1.0 (CONGELADO)  
**Supabase project ref:** `einnzgvdlmotkjebcadm`

### Stack actual

```
Next.js 15.5.19
React 19
TypeScript 5
Supabase (@supabase/ssr + @supabase/supabase-js)
Tailwind CSS 4
shadcn/ui
```

Scripts útiles:

```bash
npm run dev
npm run lint
npm run build
npm run seed:csv
npm run seed:csv:dry-run
```

---

## 3. Estado actual (completado)

### Etapa 0 ✅

Tablas: `profiles`, `regulatory_authorities`, `regulatory_documents`, `regulatory_lists`, `ingredients`

Migración: `supabase/migrations/20250626100000_initial_schema.sql`

### Etapa 1A ✅

Tablas: `ingredient_synonyms`, `ingredient_rules`, `restrictions`, `rule_versions`

Migración: `supabase/migrations/20250627100000_etapa_1a_core_rules.sql`

Seed desde CSV: `data/seeds/proyecto_listados_normalizado.csv`  
Script: `scripts/seed-from-csv.ts` (idempotente)

**Datos cargados (verificado):**

| Entidad | Cantidad |
|---------|----------|
| Ingredientes | 1.783 |
| Reglas | 1.893 |
| Restricciones | 443 |
| needs_review | 239 |
| Documentos | 17 |

### Sprint 1A ✅ — Search Experience (UX)

Búsqueda actual: **ILIKE + sinónimos** en TypeScript.

**Rutas existentes:**

| Ruta | Función |
|------|---------|
| `/app/dashboard` | Hero search + métricas |
| `/app/ingredients` | Catálogo con tarjetas |
| `/app/ingredients/[id]` | Perfil ingrediente |
| `/app/rules` | Listado reglas |
| `/app/rules/[id]` | Perfil regla |
| `/api/search` | Búsqueda en tiempo real (GET, auth required) |

**Archivos de búsqueda actuales:**

```
src/lib/search/types.ts           — IngredientSearchResult, SearchMatchField
src/lib/search/ilike-provider.ts  — ILIKE + sinónimos (Sprint 1A)
src/lib/search/index.ts           — punto de entrada
src/lib/search/escape-like.ts
src/app/api/search/route.ts       — GET → searchIngredients()
src/components/search/ingredient-search.tsx  — debounce, ⌘K, dropdown
src/components/search/header-search.tsx
```

**Tipo actual de resultado:**

```typescript
type IngredientSearchResult = {
  id: string;
  displayName: string;
  inci_name: string | null;
  chemical_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  matchField: SearchMatchField;
  matchLabel: string;
  ruleCount: number;
  needsReview: boolean;
  primaryStatus: string | null;
};
```

**Limitaciones actuales de ILIKE:**

- No ranking de relevancia real
- No busca en texto de restricciones, listas ni documentos
- No match exacto prioritario por CAS / CI
- No preparado para escalar a búsqueda semántica

---

## 4. Objetivo Sprint 1B

Convertir la búsqueda simple actual en una **búsqueda regulatoria sólida, rápida y preparada para escalar**.

**Este sprint NO integra OpenAI ni embeddings.**

Dejar lista la base técnica para:

- búsqueda por texto libre
- ranking de resultados
- búsqueda por INCI, CAS, Color Index, nombre químico, sinónimos
- búsqueda por texto de restricciones / listas / documentos
- futura búsqueda semántica / embeddings

---

## 5. Alcance Sprint 1B

### 5.1 PostgreSQL Full Text Search

Migración SQL con `search_vector` (GENERATED STORED) en:

- `ingredients`
- `ingredient_synonyms`
- `ingredient_rules`
- `restrictions`
- `regulatory_documents`
- `regulatory_lists`

Config FTS: `'simple'` (INCI/nombres EN/ES, sin stemming agresivo).

### 5.2 Read model — VIEW `ingredient_search_index`

Grano: **1 fila por ingrediente activo**.

Debe combinar:

- ingredient id, inci_name, chemical_name, cas_number, color_index, einecs
- synonyms (agregados)
- regulatory list names/codes
- rule_status, needs_review
- restriction warning_text, limitation_text, condition_text
- document title, document_number, source_label, mercosur_reference
- `search_vector` unificado
- `display_name`, `rule_count`, `restriction_count`, `has_needs_review`

**Recomendación:** VIEW (no materialized view) — escala actual ~1.8k ingredientes.

### 5.3 RPC PostgreSQL

```sql
search_ingredients(query_text text, limit_count int default 20)
```

Retorna:

- ingredient_id, display_name, inci_name, chemical_name, cas_number, color_index
- rule_count, restriction_count, has_needs_review
- match_field, match_context, rank

`SECURITY INVOKER` + `GRANT EXECUTE TO authenticated`.

### 5.4 Ranking (prioridad)

1. match exacto CAS (normalizado, sin guiones)
2. match exacto Color Index / CI
3. match exacto INCI
4. match parcial INCI (prefix > contains)
5. match chemical_name
6. match synonym
7. match regulatory_text (listas, restricciones, docs)
8. + `ts_rank(search_vector, plainto_tsquery) * 100`

Combinación: ILIKE prioritario + `to_tsvector` / `plainto_tsquery` + `ts_rank`.

### 5.5 Server Action

```
src/modules/search/actions/search-ingredients.ts
```

- `'use server'`
- Llama `supabase.rpc('search_ingredients', { query_text, limit_count })`
- No Supabase directo desde componentes client

### 5.6 UI Search

Actualizar `IngredientSearch`:

- mínimo 2 caracteres
- debounce ~120ms
- loading / empty / stale-while-revalidate
- navegación a `/app/ingredients/[id]`
- usar Server Action (no fetch directo a Supabase)

### 5.7 Dashboard

Conectar buscador principal del dashboard a la nueva búsqueda FTS.

### 5.8 Página `/app/search`

- query por URL: `/app/search?q=titanium`
- resultados listados
- badges: CAS, CI, needs_review, status principal
- link a ficha
- **Sin filtros avanzados todavía**

### 5.9 Documentación

Crear `docs/SEARCH_STRATEGY.md`:

- búsqueda actual
- ranking
- límites
- candidatos a embeddings futuros
- dónde se integraría semántica y por qué no ahora

---

## 6. NO implementar en Sprint 1B

- OpenAI API
- embeddings / pgvector
- chat / IA generativa
- búsqueda semántica
- comparador
- filtros avanzados
- exportación
- pagos
- edición
- importador transaccional (Etapa 2)
- materialized view (salvo que revisión demuestre necesidad)

---

## 7. Criterios de aceptación

### Queries manuales obligatorias

| Query | Resultado esperado |
|-------|-------------------|
| `titanium` | TITANIUM DIOXIDE |
| `Titanium Dioxide` | match exacto INCI |
| `CI 77891` | colorante CI 77891 |
| `13463-67-7` | match CAS (si cargado en DB) |
| `benzophenone` | BENZOPHENONE-3, BENZOPHENONE-8, etc. |
| `octocrylene` | OCTOCRYLENE |
| `phenoxyethanol` | PHENOXYETHANOL |
| `filtros uv` | ingredientes en lista "Filtros UV" |
| `prohibidos` | ingredientes en lista "Prohibidos" |
| `contiene Benzophenone` | match en texto regulatorio / restricciones |

### Técnicos

- `npm run lint` OK
- `npm run build` OK
- dashboard no se rompe
- no expone service role al cliente
- consultas vía Server Action + RPC
- no hay OpenAI

---

## 8. Decisiones de diseño propuestas

| Tema | Decisión propuesta |
|------|-------------------|
| Config FTS | `'simple'` |
| Read model | VIEW (no materializada) |
| Grano | 1 fila por ingrediente |
| `search_vector` en tablas | GENERATED STORED + GIN index |
| Texto regulatorio | agregado en VIEW vía `string_agg` |
| Cliente → DB | Server Action → RPC |
| ILIKE actual | reemplazar por RPC híbrida |
| `/api/search` | eliminar o thin wrapper (pendiente confirmación) |

---

## 9. Migración SQL propuesta (completa)

**Archivo:** `supabase/migrations/20250628100000_sprint_1b_fts.sql`

```sql
-- Sprint 1B — Full Text Search foundation
-- Requiere: 20250626100000_initial_schema.sql + 20250627100000_etapa_1a_core_rules.sql

-- ---------------------------------------------------------------------------
-- Helpers de normalización
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
  SELECT regexp_replace(
    lower(trim(coalesce(input_text, ''))),
    '[^0-9a-z]',
    '',
    'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_color_index(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    lower(trim(coalesce(input_text, ''))),
    '^ci\s*',
    '',
    'g'
  );
$$;

-- ---------------------------------------------------------------------------
-- search_vector en tablas fuente (GENERATED STORED)
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(inci_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(chemical_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(cas_number, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(color_index, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(einecs, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(notes, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_ingredients_search_vector
  ON public.ingredients USING gin (search_vector);

ALTER TABLE public.ingredient_synonyms
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(synonym, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_ingredient_synonyms_search_vector
  ON public.ingredient_synonyms USING gin (search_vector);

ALTER TABLE public.regulatory_documents
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(document_number, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(source_label, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(mercosur_reference, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_regulatory_documents_search_vector
  ON public.regulatory_documents USING gin (search_vector);

ALTER TABLE public.regulatory_lists
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(code, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_regulatory_lists_search_vector
  ON public.regulatory_lists USING gin (search_vector);

ALTER TABLE public.ingredient_rules
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(rule_status, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(conditions_raw, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(review_reason, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_ingredient_rules_search_vector
  ON public.ingredient_rules USING gin (search_vector);

ALTER TABLE public.restrictions
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(application_area, '')), 'D') ||
    setweight(to_tsvector('simple', coalesce(limitation_text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(warning_text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(condition_text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(notes, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_restrictions_search_vector
  ON public.restrictions USING gin (search_vector);

-- ---------------------------------------------------------------------------
-- Read model: ingredient_search_index (VIEW)
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
    string_agg(DISTINCT rd.title, ' ' ORDER BY rd.title) AS document_titles,
    string_agg(DISTINCT rd.document_number, ' ') AS document_numbers,
    string_agg(DISTINCT rd.source_label, ' ') AS source_labels,
    string_agg(DISTINCT rd.mercosur_reference, ' ') AS mercosur_references,
    string_agg(DISTINCT r.limitation_text, ' ' ORDER BY r.limitation_text)
      FILTER (WHERE r.limitation_text IS NOT NULL) AS limitation_texts,
    string_agg(DISTINCT r.warning_text, ' ' ORDER BY r.warning_text)
      FILTER (WHERE r.warning_text IS NOT NULL) AS warning_texts,
    string_agg(DISTINCT r.condition_text, ' ' ORDER BY r.condition_text)
      FILTER (WHERE r.condition_text IS NOT NULL) AS condition_texts,
    string_agg(DISTINCT ir.conditions_raw, ' ' ORDER BY ir.conditions_raw)
      FILTER (WHERE ir.conditions_raw IS NOT NULL) AS conditions_raw_texts
  FROM public.ingredient_rules ir
  LEFT JOIN public.regulatory_lists rl ON rl.id = ir.list_id
  LEFT JOIN public.regulatory_documents rd ON rd.id = ir.document_id
  LEFT JOIN public.restrictions r ON r.ingredient_rule_id = ir.id AND r.is_active = true
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
  coalesce(ra.document_titles, '') AS document_titles,
  coalesce(ra.document_numbers, '') AS document_numbers,
  coalesce(ra.source_labels, '') AS source_labels,
  coalesce(ra.mercosur_references, '') AS mercosur_references,
  trim(both ' ' from concat_ws(
    ' ',
    coalesce(ra.list_names, ''),
    coalesce(ra.list_codes, ''),
    coalesce(ra.document_titles, ''),
    coalesce(ra.document_numbers, ''),
    coalesce(ra.limitation_texts, ''),
    coalesce(ra.warning_texts, ''),
    coalesce(ra.condition_texts, ''),
    coalesce(ra.conditions_raw_texts, '')
  )) AS regulatory_text,
  coalesce(
    nullif(trim(i.inci_name), ''),
    nullif(trim(i.chemical_name), ''),
    CASE WHEN i.color_index IS NOT NULL THEN 'CI ' || i.color_index END,
    i.cas_number,
    'Sin nombre'
  ) AS display_name,
  (
    coalesce(i.search_vector, ''::tsvector) ||
    setweight(to_tsvector('simple', coalesce(sa.synonyms_text, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(ra.list_names, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.list_codes, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.document_titles, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.document_numbers, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.limitation_texts, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.warning_texts, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.condition_texts, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(ra.conditions_raw_texts, '')), 'D')
  ) AS search_vector
FROM public.ingredients i
LEFT JOIN synonym_agg sa ON sa.ingredient_id = i.id
LEFT JOIN rule_agg ra ON ra.ingredient_id = i.id
WHERE i.is_active = true;

COMMENT ON VIEW public.ingredient_search_index IS
  'Read model unificado para búsqueda regulatoria por ingrediente. Sprint 1B.';

-- ---------------------------------------------------------------------------
-- RPC: search_ingredients
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
  match_field TEXT,
  match_context TEXT,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  q_raw TEXT := trim(coalesce(query_text, ''));
  q_norm TEXT := public.normalize_search_text(query_text);
  q_cas TEXT := public.normalize_cas(query_text);
  q_ci TEXT := public.normalize_color_index(query_text);
  q_tsquery tsquery;
  effective_limit INT := greatest(1, least(coalesce(limit_count, 20), 50));
BEGIN
  IF length(q_raw) < 2 THEN
    RETURN;
  END IF;

  q_tsquery := plainto_tsquery('simple', q_raw);

  RETURN QUERY
  WITH base AS (
    SELECT *
    FROM public.ingredient_search_index idx
    WHERE
      public.normalize_cas(idx.cas_number) = q_cas
      OR public.normalize_color_index(idx.color_index) = q_ci
      OR public.normalize_color_index(q_raw) = public.normalize_color_index(idx.color_index)
      OR idx.inci_name ILIKE q_raw
      OR idx.inci_name ILIKE q_raw || '%'
      OR idx.inci_name ILIKE '%' || q_raw || '%'
      OR idx.chemical_name ILIKE '%' || q_raw || '%'
      OR idx.synonyms_text ILIKE '%' || q_raw || '%'
      OR idx.regulatory_text ILIKE '%' || q_raw || '%'
      OR idx.search_vector @@ q_tsquery
  ),
  scored AS (
    SELECT
      b.*,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(b.cas_number) = q_cas THEN 1000
        WHEN q_ci <> '' AND public.normalize_color_index(b.color_index) = q_ci THEN 900
        WHEN public.normalize_color_index(q_raw) <> ''
             AND public.normalize_color_index(b.color_index) = public.normalize_color_index(q_raw) THEN 880
        WHEN public.normalize_search_text(b.inci_name) = q_norm THEN 800
        WHEN b.inci_name ILIKE q_raw || '%' THEN 700
        WHEN b.inci_name ILIKE '%' || q_raw || '%' THEN 600
        WHEN b.chemical_name ILIKE '%' || q_raw || '%' THEN 500
        WHEN b.synonyms_text ILIKE '%' || q_raw || '%' THEN 450
        WHEN b.regulatory_text ILIKE '%' || q_raw || '%' THEN 350
        ELSE 0
      END AS priority_boost,
      ts_rank(b.search_vector, q_tsquery) AS fts_rank,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(b.cas_number) = q_cas THEN 'cas_number'
        WHEN q_ci <> '' AND public.normalize_color_index(b.color_index) IN (q_ci, public.normalize_color_index(q_raw)) THEN 'color_index'
        WHEN public.normalize_search_text(b.inci_name) = q_norm THEN 'inci_name'
        WHEN b.inci_name ILIKE '%' || q_raw || '%' THEN 'inci_name'
        WHEN b.chemical_name ILIKE '%' || q_raw || '%' THEN 'chemical_name'
        WHEN b.synonyms_text ILIKE '%' || q_raw || '%' THEN 'synonym'
        WHEN b.regulatory_text ILIKE '%' || q_raw || '%' THEN 'regulatory_text'
        ELSE 'full_text'
      END AS match_field,
      CASE
        WHEN q_cas <> '' AND public.normalize_cas(b.cas_number) = q_cas THEN b.cas_number
        WHEN public.normalize_color_index(b.color_index) IS NOT NULL
             AND public.normalize_color_index(b.color_index) <> '' THEN 'CI ' || b.color_index
        WHEN b.inci_name IS NOT NULL THEN b.inci_name
        WHEN b.chemical_name IS NOT NULL THEN b.chemical_name
        ELSE left(b.regulatory_text, 120)
      END AS match_context
    FROM base b
  )
  SELECT
    s.ingredient_id,
    s.display_name,
    s.inci_name,
    s.chemical_name,
    s.cas_number,
    s.color_index,
    s.rule_count,
    s.restriction_count,
    s.has_needs_review,
    s.match_field,
    s.match_context,
    (s.priority_boost + (s.fts_rank * 100))::real AS rank
  FROM scored s
  ORDER BY rank DESC, s.display_name ASC
  LIMIT effective_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_ingredients(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_ingredients(TEXT, INT) TO authenticated;
```

---

## 10. Estructura de archivos a crear/modificar

```
supabase/migrations/
  20250628100000_sprint_1b_fts.sql              ← NUEVO

docs/
  SEARCH_STRATEGY.md                             ← NUEVO
  SPRINT_1B_HANDOFF_FOR_CHATGPT.md               ← este archivo

src/modules/search/
  README.md                                      ← NUEVO
  types.ts                                       ← NUEVO
  normalize-query.ts                             ← NUEVO
  mappers/map-rpc-result.ts                      ← NUEVO
  actions/search-ingredients.ts                  ← NUEVO ('use server')

src/lib/search/
  index.ts                                       ← MODIFICAR (facade → modules/search)
  types.ts                                       ← MODIFICAR
  ilike-provider.ts                              ← DEPRECAR / eliminar post-migración

src/app/api/search/route.ts                     ← ELIMINAR o thin wrapper (confirmar)
src/app/app/search/page.tsx                     ← NUEVO

src/components/search/
  ingredient-search.tsx                         ← MODIFICAR (Server Action)
  search-result-row.tsx                         ← NUEVO
  header-search.tsx                             ← sin cambios

src/components/layout/app-sidebar.tsx           ← MODIFICAR (link /app/search opcional)
src/types/database.types.ts                     ← REGENERAR con Supabase CLI
```

**Flujo de datos:**

```
[Client: IngredientSearch / /app/search]
        ↓ debounce 120ms
[Server Action: searchIngredientsAction(q, limit)]
        ↓ createClient() server-side
[Supabase RPC: search_ingredients]
        ↓ SECURITY INVOKER + RLS
[ingredient_search_index VIEW]
        ↓
[DTO mapeado → UI]
```

---

## 11. Schema relevante (referencia rápida)

### ingredients

```sql
id, inci_name (nullable post-1A), chemical_name, cas_number, color_index, einecs,
function, notes, is_active, created_at, updated_at
```

### ingredient_synonyms

```sql
id, ingredient_id, synonym, synonym_type, source, created_at
```

### ingredient_rules

```sql
id, ingredient_id, authority_id, list_id, document_id, rule_status,
source_record_id, entry_number_ar, entry_number_eu, conditions_raw,
needs_review, review_reason, is_active, ...
```

### restrictions

```sql
id, ingredient_rule_id, application_area, max_concentration, concentration_unit,
limitation_text, warning_text, condition_text, notes, is_active, ...
```

### regulatory_lists

```sql
id, authority_id, name, code, description, is_active, ...
```

### regulatory_documents

```sql
id, authority_id, title, document_type, document_number, source_url,
mercosur_reference, source_label, summary, status, ...
```

---

## 12. Preguntas abiertas para ChatGPT

Respondé cada una con **APROBAR / RECHAZAR / MODIFICAR** + justificación:

1. **¿La VIEW sin materializar es suficiente para ~1.8k ingredientes?** ¿Cuándo migrar a materialized view?

2. **¿Config FTS `'simple'` es la correcta** para INCI + español + CAS, o conviene un diccionario custom?

3. **¿El ranking híbrido ILIKE + ts_rank propuesto es adecuado** o hay edge cases (ej. CAS parcial, "CI 77891" vs "77891")?

4. **¿Eliminar `/api/search`** y usar solo Server Action, o mantener wrapper?

5. **¿Agregar link "Búsqueda" en sidebar** además de `/app/search`?

6. **¿Los `search_vector` GENERATED STORED en 6 tablas** son necesarios si la VIEW ya reconstruye el vector, o es redundante?

7. **¿RLS + SECURITY INVOKER en la RPC** es suficiente para seguridad?

8. **¿Hay riesgo de performance** en la CTE `base` con muchos OR + ILIKE `%query%`?

9. **¿Qué ajustes harías** para que `filtros uv`, `prohibidos` y `contiene Benzophenone` rankeen bien?

10. **¿La propuesta está APROBADA PARA IMPLEMENTAR**, **APROBADA CON CAMBIOS** o **RECHAZADA**?

---

## 13. Contenido previsto para `docs/SEARCH_STRATEGY.md`

Outline:

1. Resumen ejecutivo
2. Arquitectura actual (VIEW + RPC + Server Action)
3. Campos indexados y pesos (A/B/C/D)
4. Algoritmo de ranking
5. Límites conocidos (min 2 chars, max 50 results, config simple)
6. Queries de ejemplo y comportamiento esperado
7. Evolución futura:
   - **Candidatos a embedding:** `regulatory_text`, `conditions_raw`, `limitation_text`, `warning_text`, `document summary`
   - **Punto de integración:** post-ranker en RPC o tabla `ingredient_embeddings` + re-rank
   - **Por qué no ahora:** evaluar calidad FTS primero; costo/latencia; no hay necesidad de semántica para identificadores exactos (CAS/INCI)

---

## 14. Respuesta para Cursor (plantilla — completar en ChatGPT)

```markdown
## Veredicto Sprint 1B
[APROBADA PARA IMPLEMENTAR | APROBADA CON CAMBIOS | RECHAZADA]

## Cambios obligatorios antes de implementar
1. ...
2. ...

## Respuestas sección 12
1. ...
2. ...
...

## SQL: cambios a la migración
[pegar SQL corregido si aplica]

## Orden de implementación recomendado
1. ...
2. ...

## Riesgos residuales
- ...

## Notas para QA manual
- ...
```

---

## 15. Archivos del repo para contexto adicional

Si ChatGPT necesita más detalle, estos archivos existen en el repo:

| Archivo | Contenido |
|---------|-----------|
| `docs/ARCHITECTURE_FREEZE.md` | Contrato arquitectónico congelado |
| `docs/DATA_MODEL.md` | Modelo de datos |
| `docs/SETUP.md` | Setup local + Supabase |
| `docs/ETAPA_1A_REVIEW_FOR_CHATGPT.md` | Handoff Etapa 1A (formato similar) |
| `supabase/migrations/20250626100000_initial_schema.sql` | Schema Etapa 0 |
| `supabase/migrations/20250627100000_etapa_1a_core_rules.sql` | Schema Etapa 1A |
| `src/lib/search/ilike-provider.ts` | Implementación actual ILIKE |
| `src/components/search/ingredient-search.tsx` | UI buscador actual |
| `data/seeds/proyecto_listados_normalizado.csv` | CSV fuente (~1893 reglas) |

---

*Generado para handoff Cursor ↔ ChatGPT — Sprint 1B FTS, junio 2026.*
