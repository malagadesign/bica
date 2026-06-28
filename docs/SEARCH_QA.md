# Cosing AR — Search QA Battery

**Sprint:** 1C — Validación producto  
**Objetivo:** Probar ranking y relevancia contra casos reales del cliente  
**Herramienta interna:** `/app/search/qa`  
**Fecha:** 28 de junio de 2026

---

## Cómo usar

1. Aplicar migraciones 1B + fix + aliases 1C en Supabase.
2. Abrir `/app/search/qa` (requiere login).
3. Ejecutar cada query de la batería.
4. Registrar en columna **Resultado observado** si difiere de lo esperado.
5. Copiar JSON desde la herramienta para pegar en revisión.

---

## Leyenda match type

| Tipo | Descripción |
|------|-------------|
| **ingrediente** | Match por INCI, CAS, CI o nombre químico |
| **lista** | Match por nombre de listado regulatorio |
| **restricción** | Match en limitation/warning/condition text |
| **documento** | Match por título/número normativo (fase futura; hoy limitado) |
| **sinónimo** | Match en `ingredient_synonyms` |

---

## Batería de queries

### Identificadores e INCI

| # | Query | Primer resultado esperado | Resultados aceptables | Match type | Notas |
|---|-------|---------------------------|----------------------|------------|-------|
| 1 | `Titanium` | TITANIUM DIOXIDE | TITANIUM DIOXIDE | ingrediente | Prefix INCI; score ~700 |
| 2 | `Titanium Dioxide` | TITANIUM DIOXIDE | TITANIUM DIOXIDE | ingrediente | INCI exacto o prefix |
| 3 | `CI 77891` | Ingrediente con CI 77891 (BLANCO) | Mismo id que `77891` | ingrediente | Normalización CI |
| 4 | `77891` | Mismo que CI 77891 | Colorante CI 77891 | ingrediente | Sin prefijo CI |
| 5 | `13463-67-7` | Ingrediente con ese CAS (si cargado) | — o vacío si TiO₂ no tiene CAS en seed | ingrediente | CAS exacto prioritario |
| 6 | `Benzophenone` | BENZOPHENONE-3 o -8 | Cualquier benzophenone INCI | ingrediente | Puede haber varios |
| 7 | `Benzophenone-3` | BENZOPHENONE-3 | BENZOPHENONE-3 (1) | ingrediente | INCI específico |
| 8 | `Octocrylene` | OCTOCRYLENE | OCTOCRYLENE | ingrediente | Filtro UV |
| 9 | `Phenoxyethanol` | PHENOXYETHANOL | PHENOXYETHANOL | ingrediente | Conservante |

### Listas regulatorias (PPT cliente)

| # | Query | Primer resultado esperado | Resultados aceptables | Match type | Notas |
|---|-------|---------------------------|----------------------|------------|-------|
| 10 | `Filtros UV` | Ingrediente de lista Filtros UV (ej. OCTOCRYLENE, TITANIUM DIOXIDE) | Top 10 mezcla filtros UV | lista | Alias `filtros uv` |
| 11 | `Conservantes` | PHENOXYETHANOL u otro conservante | Varios de lista Conservantes | lista | Alias conservantes |
| 12 | `Prohibidos` | Ingrediente de lista Prohibidos | Varios prohibidos | lista | Alias prohibidos |
| 13 | `Formaldehído` | Formaldehído [FORMALDEHYDE] o regla lista Formaldehído | Ingredientes lista formaldehido | lista | Alias sprint 1C |
| 14 | `Triclosan` | TRICLOSAN | TRICLOSAN, TRICLOCARBAN | ingrediente/lista | Doc Triclosan |
| 15 | `Microperlas` | NYLON, PE, PP, etc. (lista Microperlas) | Polímeros microperlas | lista | Alias sprint 1C |
| 16 | `Uñas artificiales` | HYDROQUINONE / BENZOYL PEROXIDE | Ingredientes lista uñas | lista | Alias sprint 1C |
| 17 | `Restrictiva` | Ingrediente de lista Restrictiva (ej. ácido bórico) | Varios restrictiva | lista | Alias sprint 1C |

### Texto libre / restricciones

| # | Query | Primer resultado esperado | Resultados aceptables | Match type | Notas |
|---|-------|---------------------------|----------------------|------------|-------|
| 18 | `contiene Benzophenone` | Ingrediente con advertencia/restricción benzophenone | Cualquier match restricción | restricción | Depende de warning_text en seed |
| 19 | `uso limitado` | Ingrediente con status limited / permitted_with_limit | Varios restringidos | restricción/lista | Texto normativo |
| 20 | `advertencia` | Ingrediente con warning_text cargado | Varios con advertencias | restricción | Busca en warning_text |

---

## Criterios de aprobación Sprint 1C

| Criterio | Umbral |
|----------|--------|
| Queries 1–9 (identificadores) | ≥ 8/9 primer resultado aceptable |
| Queries 10–17 (listas) | ≥ 6/8 devuelven resultados relevantes de la lista |
| Queries 18–20 (texto) | ≥ 2/3 devuelven algo relevante (datos seed limitados) |
| Errores RPC | 0 errores 500 en `/api/search` |
| CI 77891 = 77891 | Mismo `ingredient_id` |

---

## Registro de ejecución (completar manualmente)

| # | Query | OK | Primer resultado | Score | match_field | Observaciones |
|---|-------|----|------------------|-------|-------------|---------------|
| 1 | Titanium | | | | | |
| 2 | Titanium Dioxide | | | | | |
| 3 | CI 77891 | | | | | |
| 4 | 77891 | | | | | |
| 5 | 13463-67-7 | | | | | |
| 6 | Benzophenone | | | | | |
| 7 | Benzophenone-3 | | | | | |
| 8 | Octocrylene | | | | | |
| 9 | Phenoxyethanol | | | | | |
| 10 | Filtros UV | | | | | |
| 11 | Conservantes | | | | | |
| 12 | Prohibidos | | | | | |
| 13 | Formaldehído | | | | | |
| 14 | Triclosan | | | | | |
| 15 | Microperlas | | | | | |
| 16 | Uñas artificiales | | | | | |
| 17 | Restrictiva | | | | | |
| 18 | contiene Benzophenone | | | | | |
| 19 | uso limitado | | | | | |
| 20 | advertencia | | | | | |

---

## Ajustes de ranking realizados (Sprint 1C)

| Ajuste | Archivo | Motivo |
|--------|---------|--------|
| Aliases Formaldehído, Microperlas, Triclosan, Uñas artificiales, Restrictiva | `20250628120000_sprint_1c_search_aliases.sql` | Listas PPT no mapeadas en 1B |
| Aliases `filtros solares`, `repelentes`, `uso limitado`, `advertencia` | idem | Variantes de búsqueda cliente |
| Fix `rank` → `relevance_score` | `20250628110000_fix_search_rank_column.sql` | Bug RPC PostgreSQL |
| Fix `#variable_conflict use_column` | idem | Ambigüedad PL/pgSQL |

**No sobrecalibrado:** scores numéricos sin cambios; solo aliases faltantes evidentes.

---

## Referencias

- Estrategia: `docs/SEARCH_STRATEGY.md`
- Requerimientos cliente: `docs/CLIENT_REQUIREMENTS_MAP.md`
- Herramienta: `/app/search/qa`
