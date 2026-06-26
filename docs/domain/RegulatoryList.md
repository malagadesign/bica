# RegulatoryList

**Tabla:** `regulatory_lists`  
**Etapa:** 0

---

## Qué representa

Un **anexo o listado temático regulatorio** definido por una autoridad. Agrupa reglas por categoría funcional.

Ejemplos reales (MERCOSUR / ANMAT):

| name | code |
|------|------|
| Conservantes | CONSERVANTES |
| Colorantes | COLORANTES |
| Sustancias prohibidas | PROHIBIDOS |
| Lista restrictiva | RESTRICTIVA |
| Alérgenos | ALERGENOS |
| Filtros UV | FILTROS_UV |
| Repelentes | REPELENTES |

Ejemplos (UE CosIng):

| name | code |
|------|------|
| Annex II — Prohibited | EU_ANNEX_II |
| Annex III — Restricted | EU_ANNEX_III |
| Annex IV — Colorants | EU_ANNEX_IV |

---

## Qué NO representa

- **No es un documento normativo.** La resolución que crea el anexo es `RegulatoryDocument`.
- **No es una regla.** "Parabeno máx 0.4%" es `IngredientRule` + `Restriction`.
- **No es un ingrediente.** El INCI es `Ingredient`.

---

## Relaciones

```
RegulatoryAuthority
  └── has many → RegulatoryList

RegulatoryList
  └── has many → IngredientRule (Etapa 1+)
```

**Nota abierta:** ¿Una lista es transversal a documentos?  
Hoy: `RegulatoryList` pertenece a `RegulatoryAuthority`, no a un documento específico.  
La misma lista "Conservantes" puede recibir reglas de Res. 2020 y Res. 2024 — la trazabilidad al documento vive en `IngredientRule.document_id`.

---

## Campos (Etapa 0)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| authority_id | UUID | FK → regulatory_authorities |
| name | TEXT | Nombre legible |
| code | TEXT | Código único por authority |
| description | TEXT | Descripción del anexo |
| is_active | BOOLEAN | Activo |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

**Constraint:** `UNIQUE (authority_id, code)`

---

## Decisiones de diseño

1. **Reemplaza tabla `lists`** del Laravel legacy — nombre explícito.
2. **Unique por authority** — `CONSERVANTES` puede existir en MERCOSUR y en otro marco con distinto authority_id.
3. **Sin FK a document** — la lista es concepto estable; el documento es la versión normativa que la alimenta.

---

## Ejemplos de uso

- Filtro en buscador: "Mostrar solo ingredientes en lista PROHIBIDOS de MERCOSUR".
- ImportProfile mapea hoja Excel "Conservantes" → `RegulatoryList.code = CONSERVANTES`.
