# RegulatoryAuthority

**Tabla:** `regulatory_authorities`  
**Etapa:** 0

---

## Qué representa

Un **organismo o marco regulatorio** que emite normas cosméticas. No es un país: es la **autoridad** que regula.

Ejemplos reales:

| name | code | country | region |
|------|------|---------|--------|
| ANMAT | ANMAT | AR | LATAM |
| MERCOSUR (GMC Cosméticos) | MERCOSUR | null | MERCOSUR |
| Unión Europea | EU | null | EUROPE |
| FDA | FDA | US | GLOBAL |
| ANVISA | ANVISA | BR | LATAM |

---

## Qué NO representa

- **No es un país.** Argentina puede tener ANMAT como authority; MERCOSUR es un marco supranacional sin `country`.
- **No es una lista regulatoria.** Conservantes/Colorantes son `RegulatoryList`.
- **No es un documento.** Res. GMC 03/2020 es `RegulatoryDocument`.
- **No es una regla sobre un ingrediente.** Eso es `IngredientRule`.

---

## Relaciones

```
RegulatoryAuthority
  ├── has many → RegulatoryDocument
  ├── has many → RegulatoryList
  └── has many → IngredientRule (Etapa 1+)
```

---

## Campos (Etapa 0)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | TEXT | Nombre legible |
| code | TEXT | Código único (ANMAT, MERCOSUR, EU) |
| country | TEXT | País ISO si aplica; nullable para marcos regionales |
| region | TEXT | MERCOSUR, LATAM, EUROPE, GLOBAL |
| description | TEXT | Descripción del organismo |
| website_url | TEXT | Sitio oficial |
| is_active | BOOLEAN | Activo en la plataforma |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

---

## Decisiones de diseño

1. **`country` nullable** — MERCOSUR y UE no son países.
2. **`code` único global** — identificador estable para imports, API y UI.
3. **Separado de RegulatoryDocument** — una authority publica muchos documentos a lo largo del tiempo.
4. **Reemplaza `Jurisdiction`** del prototipo Laravel — nombre más preciso para el dominio.

---

## Ejemplos de uso

- Filtrar todas las reglas emitidas por ANMAT.
- Mostrar en UI: "Fuente: MERCOSUR — Res. GMC 03/2020".
- Asociar un ImportProfile a la authority correcta al importar CSV MERCOSUR.
