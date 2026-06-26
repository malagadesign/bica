# Ingredient

**Tabla:** `ingredients` (+ `ingredient_synonyms` en Etapa 1)  
**Etapa:** 0 (synonyms en Etapa 1)

---

## Qué representa

El **dato maestro de una sustancia cosmética**. Contiene únicamente información propia del ingrediente, independiente de cualquier regulación.

Ejemplos reales:

| inci_name | cas_number | chemical_name | function |
|-----------|------------|---------------|----------|
| Zinc Oxide | 1314-13-2 | Zinc oxide | UV Filter, Colorant |
| Phenoxyethanol | 122-99-6 | 2-Phenoxyethanol | Preservative |
| CI 77491 | 1309-37-1 | Iron oxides | Colorant |

---

## Qué NO representa

- **No contiene restricciones** (concentración, advertencias) → eso es `Restriction`.
- **No indica en qué listas aparece** → eso es `IngredientRule`.
- **No indica si está prohibido o permitido** → depende del contexto regulatorio.
- **No es una fila del CSV** → el CSV alimenta reglas; el ingrediente es entidad maestra deduplicada.

---

## Relaciones

```
Ingredient
  ├── has many → IngredientSynonym (Etapa 1)
  └── has many → IngredientRule (Etapa 1)
```

---

## Campos (Etapa 0)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| inci_name | TEXT | Nombre INCI (identificador principal) |
| chemical_name | TEXT | Nombre químico / IUPAC |
| cas_number | TEXT | Número CAS |
| einecs | TEXT | Número EINECS/ELINCS (UE) |
| function | TEXT | Función cosmética general |
| notes | TEXT | Observaciones internas |
| is_active | BOOLEAN | Activo en catálogo |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

### IngredientSynonym (Etapa 1)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| ingredient_id | UUID | FK |
| synonym | TEXT | Variante de nombre |
| synonym_type | TEXT | trade_name, inci_variant, common_name |

---

## Decisiones de diseño

1. **Un ingrediente, muchas reglas** — la misma sustancia puede estar en Conservantes MERCOSUR, Restrictiva MERCOSUR y Annex III UE.
2. **Deduplicación en import** — `firstOrCreate` por INCI + CAS en pipeline de importación.
3. **FTS en Etapa 3** — `search_vector` sobre inci_name, chemical_name, synonyms.
4. **Sin campo `status` regulatorio** — el estado (permitido/prohibido/restringido) vive en `IngredientRule`, no en el maestro.

---

## Ejemplos de uso

- Búsqueda: "Phenoxyethanol" → ficha maestra → pestañas con todas sus IngredientRules por authority/lista.
- Comparador futuro: mismo Ingredient, reglas distintas en MERCOSUR vs UE.
