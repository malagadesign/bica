# IngredientRule

**Tabla:** `ingredient_rules`  
**Etapa:** 1

---

## Qué representa

Una **regla regulatoria aplicada a un ingrediente** dentro de una lista, autoridad y documento normativo concreto.

Es la entidad central del dominio. Reemplaza el concepto ambiguo de "Entry".

Ejemplo real:

> **Phenoxyethanol** (Ingredient) está regulado como **conservante** (RegulatoryList: CONSERVANTES) bajo **MERCOSUR** (RegulatoryAuthority) según **Res. GMC 03/2020** (RegulatoryDocument), con condiciones de uso definidas en una o más **Restrictions**.

Otro ejemplo:

> **Formaldehyde** aparece en **PROHIBIDOS** (lista) y también en **RESTRICTIVA** (lista) — son **dos IngredientRules distintas** para el mismo Ingredient.

---

## Qué NO representa

- **No es el ingrediente maestro** → es `Ingredient`.
- **No es la condición de uso detallada** → eso es `Restriction` (concentración, advertencias, leave-on…).
- **No es el documento normativo** → es `RegulatoryDocument` (la regla *referencia* al documento).
- **No es una fila del Excel** → el Excel se normaliza en reglas + restricciones.

---

## Relaciones

```
IngredientRule
  ├── belongs to → Ingredient
  ├── belongs to → RegulatoryAuthority
  ├── belongs to → RegulatoryList
  ├── belongs to → RegulatoryDocument
  ├── belongs to → ImportBatch (opcional, trazabilidad)
  ├── has many → Restriction
  └── has many → RuleVersion
```

### Relación conceptual (regla de oro)

```
Ingredient  →  IngredientRule  →  Restriction
```

---

## Campos conceptuales (Etapa 1)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| ingredient_id | UUID | FK → ingredients |
| authority_id | UUID | FK → regulatory_authorities |
| list_id | UUID | FK → regulatory_lists |
| document_id | UUID | FK → regulatory_documents |
| import_batch_id | UUID | FK → import_batches (nullable) |
| rule_status | TEXT | active, archived, superseded |
| effective_date | DATE | Vigencia de esta regla |
| notes | TEXT | Notas |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

**Constraint sugerido:** una regla se identifica por `(ingredient_id, authority_id, list_id, document_id)` — pero la misma sustancia puede tener **múltiples reglas** en distintas listas o documentos.

---

## Decisiones de diseño

1. **Reemplaza `Entry`** — nombre semántico para audiencia regulatoria.
2. **`authority_id` redundante pero útil** — derivable de list/document, pero acelera queries y RLS.
3. **Siempre vinculada a document** — toda regla tiene fuente normativa explícita.
4. **Prohibidos pueden tener 0 Restrictions** — la regla en sí es "prohibido"; no requiere concentración.
5. **Nunca DELETE** — `rule_status = archived` + `RuleVersion` snapshot.

---

## Ejemplos de uso

- Listar todas las reglas de Zinc Oxide en MERCOSUR.
- Diff entre Res. 2020 y Res. 2024: comparar IngredientRules por document_id.
- Import CSV: crear/actualizar IngredientRule + Restrictions en transacción.

---

## Pregunta abierta para arquitecto

¿Cardinalidad IngredientRule → Restriction es 1:N siempre, o 1:1 en la mayoría de casos con N solo para colorantes multi-campo?

**Propuesta:** 1:N siempre — más flexible, UI agrupa restrictions bajo la regla.
