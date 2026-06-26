# Modelo de Dominio — Cosing AR

Índice de entidades del dominio regulatorio cosmético.

## Jerarquía

```
RegulatoryAuthority
  ├── RegulatoryDocument
  ├── RegulatoryList
  └── IngredientRule → Restriction, RuleVersion

Ingredient → IngredientSynonym, IngredientRule[]

ImportBatch → ImportProfile, ImportRow, ImportDiff
```

## Relación central

```
Ingredient  →  IngredientRule  →  Restriction
```

## Fichas por entidad

| Entidad | Archivo | Etapa |
|---------|---------|-------|
| RegulatoryAuthority | [RegulatoryAuthority.md](./RegulatoryAuthority.md) | 0 |
| RegulatoryDocument | [RegulatoryDocument.md](./RegulatoryDocument.md) | 0 |
| RegulatoryList | [RegulatoryList.md](./RegulatoryList.md) | 0 |
| Ingredient | [Ingredient.md](./Ingredient.md) | 0 |
| IngredientRule | [IngredientRule.md](./IngredientRule.md) | 1 |
| Restriction | [Restriction.md](./Restriction.md) | 1 |
| ImportProfile | [ImportProfile.md](./ImportProfile.md) | 2 |
| KnowledgeLayer | [KnowledgeLayer.md](./KnowledgeLayer.md) | 6+ |

## Nomenclatura oficial (tablas PostgreSQL)

| Entidad | Tabla |
|---------|-------|
| RegulatoryAuthority | `regulatory_authorities` |
| RegulatoryDocument | `regulatory_documents` |
| RegulatoryList | `regulatory_lists` |
| Ingredient | `ingredients` |
| IngredientSynonym | `ingredient_synonyms` |
| IngredientRule | `ingredient_rules` |
| Restriction | `restrictions` |
| RuleVersion | `rule_versions` |
| ImportProfile | `import_profiles` |
| ImportBatch | `import_batches` |
| ImportRow | `import_rows` |
| ImportDiff | `import_diffs` |

## Reglas transversales

1. **Nunca DELETE físico** en datos regulatorios — usar `archived_at` o `status`.
2. **Toda IngredientRule debe referenciar un RegulatoryDocument** (Etapa 1+).
3. **El importador nunca hardcodea columnas** — usa ImportProfile.
4. **Ingredient es maestro** — no contiene restricciones ni pertenencia a listas.
