# Cosing AR — Revisión Etapa 1A para ChatGPT

**Uso:** Copiar este archivo completo en ChatGPT. Pedir revisión crítica y completar la sección **8. Respuesta para Cursor** al final. Pegar esa respuesta de vuelta en Cursor para implementar.

**Fecha:** 26 de junio de 2026  
**Estado del proyecto:** Etapa 0 aprobada. Etapa 1A propuesta, pendiente de confirmación.

---

## 1. Instrucciones para ChatGPT

Actuá como **arquitecto de datos + product owner técnico** del proyecto Cosing AR.

Tu tarea:

1. Revisar la propuesta de **Etapa 1A** (migración SQL + script seed + UI mínima).
2. Verificar alineación con `ARCHITECTURE_FREEZE.md` (contrato congelado).
3. Detectar riesgos, inconsistencias o sobre-ingeniería.
4. Responder **cada pregunta de la sección 7** con decisión explícita (APROBAR / RECHAZAR / MODIFICAR + justificación breve).
5. Indicar si la propuesta está **APROBADA PARA IMPLEMENTAR**, **APROBADA CON CAMBIOS** o **RECHAZADA**.
6. Completar la plantilla de respuesta de la **sección 8** para que el equipo la pegue en Cursor.

**Restricciones del proyecto (no negociables):**

- Stack: Next.js 15 + Supabase + Vercel.
- No tocar el legacy Laravel (`cosing-ar/`).
- Etapa 1A **NO** es el importador transaccional final (eso es Etapa 2).
- No implementar aún: preview, rollback, diff, ImportBatch, FTS, IA, comparador, pagos.
- `needs_review` debe conservarse y ser filtrable.
- Relación central: `Ingredient → IngredientRule → Restriction`.
- Prohibidos pueden tener 0 restrictions.

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

### Etapa 0 — COMPLETADA

Tablas existentes en Supabase:

- `profiles`
- `regulatory_authorities`
- `regulatory_documents`
- `regulatory_lists`
- `ingredients`

Schema actual de `ingredients`:

```sql
inci_name      TEXT NOT NULL,   -- BLOQUEANTE para CSV: 1765 filas sin INCI
chemical_name  TEXT,
cas_number     TEXT,
einecs         TEXT,
function       TEXT,
notes          TEXT,
```

RLS: lectura autenticada en tablas regulatorias.

---

## 3. Objetivo Etapa 1A

**Seed controlado desde CSV normalizado** — validar el modelo con datos reales.

### Incluye

- Migración SQL: tablas `ingredient_synonyms`, `ingredient_rules`, `restrictions`, `rule_versions`
- Ajustes menores a tablas Etapa 0
- Script local Node/TS (`scripts/seed-from-csv.ts`) con `--dry-run`
- Reporte post-seed (insertados, omitidos, needs_review)
- Pantallas lectura simple: listado ingredientes, detalle, filtro needs_review

### NO incluye

Importador transaccional, ImportProfile, ImportBatch, preview, rollback, diff, FTS, IA, comparador, pagos.

---

## 4. Datos del CSV

**Archivo:** `supabase/migrations/proyecto_listados_normalizado.csv`  
*(Nota: debería moverse a `data/seeds/` — no es migración SQL)*

### Métricas

| Métrica | Valor |
|---------|-------|
| Registros | 1.895 |
| Columnas | 29 |
| `record_id` únicos | 1.895 |
| Tipos de listado (`list_type`) | 16 |
| Documentos únicos (local_norm + mercosur_norm + source_label + source_url) | 17 |
| `needs_review = YES` | 239 |
| Ingredientes únicos estimados (dedup) | ~1.787 |
| Filas sin identidad deduplicable | 2 |
| Filas sin INCI | 1.765 |
| Filas sin CAS | 409 |
| Filas con `color_index` | 170 |
| Filas con campos de restriction (6 cols, sin conditions_raw) | 445 |
| Prohibidos sin esos 6 campos de restriction | 1.407 |

### Columnas CSV

```
record_id, source_sheet, source_row_start, source_row_end, list_type, status,
jurisdiction, source_label, mercosur_norm, local_norm, source_url,
entry_number_ar, entry_number_eu, ingredient_name_es, inci_name, cas_number,
ec_number, color_index, color, application_area, max_concentration, unit,
expressed_as, limitations, warnings, conditions_raw, notes, needs_review,
review_reason
```

### Distribución `list_type`

| list_type | Registros |
|-----------|-----------|
| Prohibidos | 1.407 |
| Colorantes | 171 |
| Restrictiva | 89 |
| Sustancias de uso limitado | 66 |
| Conservantes | 61 |
| Filtros UV | 37 |
| Alérgenos | 26 |
| Microperlas | 9 |
| Repelentes | 8 |
| Prohibidos antibacteriales con enjuague | 8 |
| Uñas artificiales | 4 |
| Prohibidos adenda argentina | 3 |
| Formaldehído adenda | 2 |
| Restrictiva adenda | 2 |
| Notas filtros UV | 1 |
| Triclosan restricción | 1 |

### Distribución `status`

| status | Registros |
|--------|-----------|
| prohibited | 1.410 |
| permitted_with_scope | 171 |
| permitted_with_limit | 106 |
| restricted | 97 |
| limited | 41 |
| labeling_required | 26 |
| not_permitted | 25 |
| prohibited_when_condition | 9 |
| prohibited_for_scope | 8 |
| note | 2 |

### Top `review_reason` (needs_review = YES)

| Motivo | Cantidad |
|--------|----------|
| Listado complejo con subrestricciones | 89 |
| Definir alcance operativo categorías A/B/C | 66 |
| Registro continuado en varias filas | 26 |
| Fila con Nº o sustancia incompleto | 24 |
| Colorante sin campo de aplicación marcado | 12 |
| Otros | 22 |

### Hallazgo crítico sobre `conditions_raw`

- **Todas** las filas Prohibidos tienen `conditions_raw` poblado.
- Si `conditions_raw` **dispara** creación de `restrictions`, no habría Prohibidos con 0 restrictions.
- Regla acordada: crear `restriction` solo si existe alguno de: `application_area`, `max_concentration`, `unit`, `expressed_as`, `limitations`, `warnings`.
- `conditions_raw` va en `ingredient_rules.conditions_raw` siempre, y en `restrictions.condition_text` solo cuando ya se crea una restriction.

---

## 5. Reglas de mapeo acordadas

### 5.1 Authority

```
name:    Argentina / MERCOSUR
code:    AR_MERCOSUR
country: AR
region:  MERCOSUR
```

### 5.2 RegulatoryDocument

Únicos desde: `local_norm` + `mercosur_norm` + `source_label` + `source_url`

| Campo DB | Origen CSV |
|----------|------------|
| `document_number` | `local_norm` (preferido) |
| `mercosur_reference` | `mercosur_norm` (columna nueva propuesta) |
| `source_label` | `source_label` (columna nueva propuesta) |
| `source_url` | `source_url` |
| `title` | `source_label` + `local_norm` |
| `summary` | `"MERCOSUR: {mercosur_norm}"` si aplica |

Documento dominante: Disposición Nº 6433/2015 + MERCOSUR/GMC/RES. N° 62/14 → ~1.399 registros.

### 5.3 RegulatoryList

Desde `list_type`. Code = UPPER_SNAKE sin acentos.

| list_type (CSV) | code propuesto |
|-----------------|----------------|
| Prohibidos | PROHIBIDOS |
| Colorantes | COLORANTES |
| Restrictiva | RESTRICTIVA |
| Conservantes | CONSERVANTES |
| Filtros UV | FILTROS_UV |
| Alérgenos | ALERGENOS |
| Microperlas | MICROPERLAS |
| Repelentes | REPELENTES |
| Sustancias de uso limitado | SUSTANCIAS_DE_USO_LIMITADO |
| Prohibidos antibacteriales con enjuague | PROHIBIDOS_ANTIBACTERIALES_CON_ENJUAGUE |
| Prohibidos adenda argentina | PROHIBIDOS_ADENDA_ARGENTINA |
| Restrictiva adenda | RESTRICTIVA_ADENDA |
| Formaldehído adenda | FORMALDEHIDO_ADENDA |
| Uñas artificiales | UNAS_ARTIFICIALES |
| Triclosan restricción | TRICLOSAN_RESTRICCION |
| Notas filtros UV | NOTAS_FILTROS_UV |

### 5.4 Ingredient

Deduplicar por prioridad:

1. `inci_name`
2. `color_index`
3. `cas_number`
4. `ingredient_name_es`

No exigir INCI.

| Campo DB | Origen CSV |
|----------|------------|
| `inci_name` | CSV (nullable propuesto) |
| `chemical_name` | `ingredient_name_es` |
| `cas_number` | CSV |
| `einecs` | `ec_number` |
| `color_index` | CSV (columna nueva propuesta) |
| `function` | `list_type` |
| `notes` | CSV `notes` |

Display UI: `COALESCE(inci_name, chemical_name, 'CI ' || color_index, cas_number)`

### 5.5 IngredientRule

Una regla por: `ingredient_id` + `list_id` + `document_id` + `source_record_id`

| Campo | Origen |
|-------|--------|
| `rule_status` | CSV `status` |
| `source_record_id` | CSV `record_id` |
| `source_sheet`, `source_row_start`, `source_row_end` | CSV |
| `entry_number_ar`, `entry_number_eu` | CSV |
| `conditions_raw` | CSV |
| `needs_review` | CSV (`YES` → true) |
| `review_reason` | CSV |
| `import_batch_id` | NULL en Etapa 1A |

### 5.6 Restriction

Crear **solo** si existe alguno de:

`application_area`, `max_concentration`, `unit`, `expressed_as`, `limitations`, `warnings`

| Campo | Origen |
|-------|--------|
| `application_area` | CSV (+ `color` si colorante) |
| `max_concentration` | CSV (parse numérico) |
| `concentration_unit` | CSV `unit` |
| `expressed_as` | CSV |
| `limitation_text` | CSV `limitations` |
| `warning_text` | CSV `warnings` |
| `condition_text` | CSV `conditions_raw` |
| `notes` | CSV `notes` |

Prohibidos sin esos campos → IngredientRule válida sin restrictions.

### 5.7 RuleVersion

Un snapshot inicial por cada IngredientRule:

```json
{
  "schema_version": 1,
  "rule": { },
  "restrictions": [],
  "source": "proyecto_listados_normalizado.csv",
  "seeded_at": "ISO8601"
}
```

### 5.8 IngredientSynonym (Etapa 1A)

Crear cuando:

- `ingredient_name_es` ≠ `inci_name` → synonym_type `spanish_name`
- hay `color_index` → synonym_type `ci`

---

## 6. Propuesta técnica (Cursor)

### 6.1 Migración propuesta

Archivo: `supabase/migrations/20250627100000_etapa_1a_core_rules.sql`

**ALTER Etapa 0:**

```sql
-- ingredients
ALTER TABLE public.ingredients ALTER COLUMN inci_name DROP NOT NULL;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS color_index TEXT;
CREATE INDEX idx_ingredients_color_index ON public.ingredients (color_index) WHERE color_index IS NOT NULL;
CREATE INDEX idx_ingredients_chemical_name ON public.ingredients (chemical_name);

-- regulatory_documents
ALTER TABLE public.regulatory_documents
  ADD COLUMN IF NOT EXISTS mercosur_reference TEXT,
  ADD COLUMN IF NOT EXISTS source_label TEXT;

CREATE UNIQUE INDEX idx_regulatory_documents_fingerprint
  ON public.regulatory_documents (
    authority_id,
    COALESCE(document_number, ''),
    COALESCE(source_url, ''),
    COALESCE(mercosur_reference, '')
  );
```

**Tablas nuevas:** `ingredient_synonyms`, `ingredient_rules`, `restrictions`, `rule_versions`

**ingredient_rules — campos clave:**

```sql
rule_status       TEXT NOT NULL,          -- valor CSV status sin CHECK rígido
source_record_id  TEXT NOT NULL UNIQUE,   -- CSV record_id
source_sheet      TEXT,
source_row_start  INTEGER,
source_row_end    INTEGER,
entry_number_ar   TEXT,
entry_number_eu   TEXT,
conditions_raw    TEXT,
needs_review      BOOLEAN NOT NULL DEFAULT false,
review_reason     TEXT,
import_batch_id   UUID,                   -- NULL en seed
UNIQUE (ingredient_id, list_id, document_id, source_record_id)
```

**restrictions:** 1:N desde ingredient_rule_id (Etapa 1A: 0 o 1 por fila CSV)

**rule_versions:** JSONB snapshot, schema_version = 1

**RLS:** SELECT para authenticated en las 4 tablas nuevas.

### 6.2 Estimación post-seed

| Entidad | Cantidad |
|---------|----------|
| RegulatoryAuthority | 1 |
| RegulatoryDocument | ~17 |
| RegulatoryList | 16 |
| Ingredient | ~1.787 |
| IngredientSynonym | ~500–800 |
| IngredientRule | ~1.893 |
| Restriction | ~445 |
| RuleVersion | ~1.893 |

### 6.3 Script seed propuesto

```
scripts/seed-from-csv.ts
scripts/seed/csv-reader.ts
scripts/seed/mappers/{authority,document,list,ingredient,rule,restriction}.ts
scripts/seed/normalize.ts
scripts/seed/report.ts
```

**Ejecución:**

```bash
SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-from-csv.ts \
  --file data/seeds/proyecto_listados_normalizado.csv \
  [--dry-run] [--only-review]
```

**Fases:** Authority → Documents → Lists → Ingredients → Rules → Restrictions → RuleVersions → reporte JSON

**Idempotencia:** skip si `source_record_id` ya existe.

### 6.4 UI mínima propuesta

| Ruta | Contenido |
|------|-----------|
| `/app/ingredients` | Listado con badge needs_review |
| `/app/ingredients/[id]` | Detalle + rules + restrictions |
| `/app/rules?needs_review=true` | 239 filas pendientes |

Sin FTS. Filtros SQL básicos.

---

## 7. Preguntas abiertas (responder cada una)

| # | Pregunta | Default propuesto |
|---|----------|-------------------|
| Q1 | ¿`ingredients.inci_name` nullable? | Sí |
| Q2 | ¿Agregar columna `color_index` a ingredients? | Sí |
| Q3 | ¿Mapear CSV `ec_number` a columna existente `einecs` (sin duplicar)? | Sí |
| Q4 | ¿`rule_status` = status CSV tal cual (TEXT libre, sin enum)? | Sí |
| Q5 | ¿Unicidad de reglas por `source_record_id` (CSV record_id)? | Sí |
| Q6 | ¿Colorantes sin INCI → generar `inci_name = 'CI {color_index}'`? | Sí |
| Q7 | ¿Seed idempotente (re-run safe por source_record_id)? | Sí |
| Q8 | ¿Mover CSV de `supabase/migrations/` a `data/seeds/`? | Sí |
| Q9 | ¿`conditions_raw` NO debe disparar creación de restriction? | Sí (ver hallazgo sección 4) |
| Q10 | ¿Agregar `mercosur_reference` y `source_label` a regulatory_documents? | Sí |
| Q11 | ¿Crear IngredientSynonym en Etapa 1A o postergar? | Crear en 1A (básico) |
| Q12 | ¿Pantallas UI incluidas en mismo PR que migración + seed? | Sí |
| Q13 | ¿Aceptar 2 filas sin identidad como skip + reporte (no abort)? | Sí |

**Preguntas adicionales para ChatGPT (si aplica):**

- ¿El índice único de documentos es correcto o conviene otra estrategia?
- ¿Falta algún índice para las pantallas de lectura?
- ¿El snapshot JSONB de RuleVersion debe incluir datos del ingrediente/documento/lista?
- ¿Hay conflicto con ARCHITECTURE_FREEZE en usar `source_record_id` como clave de unicidad?
- ¿Recomendás normalizar `rule_status` CSV a enum interno ahora o en Etapa 2?

---

## 8. Respuesta para Cursor (completar y pegar)

```markdown
## Veredicto Etapa 1A

**Estado:** [APROBADA PARA IMPLEMENTAR | APROBADA CON CAMBIOS | RECHAZADA]

**Resumen (2-3 oraciones):**

---

## Decisiones Q1–Q13

| # | Decisión | Notas |
|---|----------|-------|
| Q1 | | |
| Q2 | | |
| Q3 | | |
| Q4 | | |
| Q5 | | |
| Q6 | | |
| Q7 | | |
| Q8 | | |
| Q9 | | |
| Q10 | | |
| Q11 | | |
| Q12 | | |
| Q13 | | |

---

## Cambios obligatorios a la propuesta

1.
2.
3.

---

## Riesgos / deuda aceptada

-

---

## Orden de implementación recomendado

1.
2.
3.

---

## Instrucción final para Cursor

[Texto libre: qué implementar exactamente y qué no tocar]
```

---

## 9. Referencia rápida ARCHITECTURE_FREEZE

Entidades congeladas Etapa 1A:

- RegulatoryAuthority → `regulatory_authorities`
- RegulatoryDocument → `regulatory_documents`
- RegulatoryList → `regulatory_lists`
- Ingredient → `ingredients`
- IngredientSynonym → `ingredient_synonyms` *(nueva)*
- IngredientRule → `ingredient_rules` *(nueva)*
- Restriction → `restrictions` *(nueva)*
- RuleVersion → `rule_versions` *(nueva)*

Reservado Etapa 2: ImportProfile, ImportBatch, ImportRow, ImportDiff.

Relación central: **Ingredient → IngredientRule → Restriction**

Cardinalidades: IngredientRule 0..N Restrictions. Prohibidos puede tener 0.

RuleVersion: append-only, snapshot JSONB, no Event Sourcing completo.
