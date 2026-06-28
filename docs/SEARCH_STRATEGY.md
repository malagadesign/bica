# Cosing AR — Search Strategy

**Sprint:** 1B — Search Foundation / Full Text Search  
**Estado:** Implementado  
**Fecha:** junio 2026

---

## Resumen

La búsqueda regulatoria de Cosing AR combina:

1. **Read model** — VIEW `ingredient_search_index` (1 fila por ingrediente activo)
2. **RPC PostgreSQL** — `search_ingredients(query_text, limit_count)` con ranking híbrido
3. **Server-side** — `searchIngredientsQuery()` / `searchIngredientsAction()`
4. **API thin wrapper** — `GET /api/search` (compatibilidad, testing, futura API pública)

No hay OpenAI, embeddings ni búsqueda semántica en este sprint.

---

## Arquitectura

```
[Client: IngredientSearch / /app/search]
        ↓ debounce 120ms
[GET /api/search  OR  searchIngredientsAction]
        ↓ createClient() — cookie auth, anon key
[Supabase RPC: search_ingredients]
        ↓ SECURITY INVOKER + RLS
[ingredient_search_index VIEW]
```

**Seguridad:** el cliente nunca recibe `SUPABASE_SERVICE_ROLE_KEY`. La RPC corre como usuario autenticado (`SECURITY INVOKER`).

---

## Read model: `ingredient_search_index`

Grano: **1 ingrediente activo**.

| Campo | Fuente |
|-------|--------|
| Identidad | `ingredients.inci_name`, `chemical_name`, `cas_number`, `color_index`, `einecs` |
| Sinónimos | `string_agg(ingredient_synonyms.synonym)` |
| Listas | `regulatory_lists.name`, `code` |
| Restricciones | `limitation_text`, `warning_text`, `condition_text` (truncados a 300 chars c/u, max 2000 total) |
| Metadata | `rule_count`, `restriction_count`, `has_needs_review`, `rule_statuses` |
| `search_vector` | Calculado en la VIEW (no en tablas fuente) |

### Por qué no `search_vector` en 6 tablas

Con ~1.800 ingredientes, mantener vectores sincronizados en cada tabla fuente agrega complejidad sin beneficio claro. El vector se construye en el read model.

**Cuándo revisar:** >50k ingredientes, >100 consultas concurrentes, o degradación medible → evaluar **materialized view** + GIN index.

---

## Algoritmo de búsqueda (2 fases)

### Fase 1 — Identificadores exactos / INCI

Usa índices B-Tree (`lower(inci_name)`, `normalize_cas()`, `normalize_color_index()`).

| Prioridad | Match |
|-----------|-------|
| 1000 | CAS exacto (normalizado) |
| 900 | Color Index exacto |
| 880 | CI desde query con prefijo (`CI 77891`, `77891`, `ci-77891`) |
| 800 | INCI exacto |
| 700 | INCI prefix |
| 650 | INCI partial |

### Fase 2 — Texto libre (solo si fase 1 no llena el límite)

| Prioridad | Match |
|-----------|-------|
| 500 | `chemical_name` |
| 450 | sinónimo |
| 400 | lista regulatoria (con aliases) |
| 380 | lista por texto directo |
| 350 | texto de restricción |
| + | `ts_rank(search_vector, plainto_tsquery) * 100` |

### Aliases de listas (`search_term_aliases`)

No es IA — es UX de búsqueda:

| Alias usuario | Expande a |
|---------------|-----------|
| filtros uv | filtros uv, filtro uv, filtros solares, protector solar, uv filter, sunscreen |
| prohibidos | prohibidos, prohibited |
| conservantes | conservantes, conservante, preservative |
| colorantes | colorantes, colorante, color |
| alérgenos | alérgenos, alergenos, allergen |
| repelentes | repelentes, repelente, repellent |

Mantenimiento: agregar filas en `search_term_aliases` cuando aparezcan nuevas listas relevantes.

---

## Config FTS

- **Diccionario:** `'simple'` — sin stemming
- **Por qué:** INCI, CAS y nombres químicos no deben alterarse (`Titanium` ≠ `Titan`)
- **No custom dictionary** en esta etapa

### Pesos del vector (A/B/C/D)

| Peso | Campos |
|------|--------|
| A | INCI, CAS, Color Index |
| B | chemical_name, sinónimos |
| C | listas, códigos, texto de restricciones |
| D | EINECS |

---

## Límites conocidos

| Límite | Valor |
|--------|-------|
| Mínimo query | 2 caracteres |
| Máximo resultados RPC | 50 |
| Default resultados | 20 |
| Debounce UI | 120ms |
| `restriction_text` agregado | max 2000 chars por ingrediente |

### Normalización Color Index

Todos equivalentes → `77891`:

- `CI77891`
- `CI 77891`
- `77891`
- `ci-77891`

---

## Queries de referencia (QA)

| Query | Comportamiento esperado |
|-------|-------------------------|
| `titanium` | TITANIUM DIOXIDE |
| `Titanium Dioxide` | match INCI |
| `CI 77891` / `77891` | mismo colorante |
| `13463-67-7` | CAS exacto (si cargado) |
| `octocrylene` | OCTOCRYLENE |
| `phenoxyethanol` | PHENOXYETHANOL |
| `filtros uv` | ingredientes en lista Filtros UV |
| `prohibidos` | ingredientes en lista Prohibidos |
| `contiene Benzophenone` | match en texto de restricción |

---

## Futura búsqueda semántica (NO implementada)

### Candidatos a embedding

Textos ricos en contexto regulatorio:

- `restriction_text` (limitation, warning, condition)
- `conditions_raw` de reglas
- `regulatory_documents.summary`
- Combinación ingrediente + listas + restricciones como documento unificado

### Punto de integración futuro

```
search_ingredients (hoy)
        ↓
[Post-ranker semántico]  ← Sprint futuro
        ↓
Re-rank top-N con similitud coseno (pgvector / servicio externo)
```

### Por qué no ahora

1. **Identificadores exactos** (CAS, INCI, CI) deben seguir siendo determinísticos — FTS + ILIKE prioritario es superior para eso.
2. **Costo y latencia** — embeddings en cada búsqueda en tiempo real no justificados sin evaluar calidad FTS primero.
3. **Datos limitados** — ~1.8k ingredientes; calibrar ranking híbrido es más urgente que semántica.
4. **Evaluación pendiente** — medir relevancia del primer resultado en queries reales antes de Sprint 2.

### Tabla futura (referencia, no creada)

```sql
-- NO IMPLEMENTAR AÚN
-- ingredient_embeddings (ingredient_id, embedding vector(1536), model, updated_at)
```

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/20250628100000_sprint_1b_fts.sql` | VIEW, RPC, aliases, índices |
| `src/modules/search/search-ingredients.ts` | Query server-side |
| `src/modules/search/actions/search-ingredients.ts` | Server Action |
| `src/app/api/search/route.ts` | Thin wrapper |
| `src/app/app/search/page.tsx` | Página dedicada |
| `src/components/search/ingredient-search.tsx` | Autocomplete UI |

---

## Evolución planificada

| Sprint | Mejora |
|--------|--------|
| 1B (actual) | FTS + ranking híbrido + aliases |
| 2 | Filtros, paginación search, métricas de relevancia |
| 3+ | Embeddings opcionales, chat regulatorio (OpenAI) |
