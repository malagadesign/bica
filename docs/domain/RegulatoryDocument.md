# RegulatoryDocument

**Tabla:** `regulatory_documents`  
**Etapa:** 0

---

## Qué representa

Un **documento normativo fuente**: resolución, disposición, anexo, adenda, PDF oficial, boletín oficial o versión normativa publicada por una autoridad.

La plataforma no guarda solo datos estructurados — debe saber **de qué norma proviene cada regla**.

Ejemplos reales:

| title | document_type | document_number |
|-------|---------------|-----------------|
| Resolución GMC Nº 03/2020 — Listado de conservantes | resolution | GMC 03/2020 |
| Anexo II — Sustancias prohibidas (CosIng) | annex | CosIng Annex II |
| Adenda al listado de filtros UV | addendum | ANMAT Dis. 2023/45 |
| Boletín Oficial — Publicación Res. MERCOSUR | gazette | BO 15/03/2024 |

---

## Qué NO representa

- **No es el archivo Excel/CSV de importación.** Eso es input del `ImportBatch`.
- **No es una lista temática.** "Conservantes" es `RegulatoryList`.
- **No es una regla sobre un ingrediente.** Eso es `IngredientRule`.
- **No reemplaza al PDF almacenado** — `file_path` apunta al archivo en Storage; el documento es el registro metadata.

---

## Relaciones

```
RegulatoryAuthority
  └── has many → RegulatoryDocument

RegulatoryDocument
  └── referenced by → IngredientRule (Etapa 1+)
  └── optional link → ImportBatch (Etapa 2+)
```

---

## Campos (Etapa 0)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| authority_id | UUID | FK → regulatory_authorities |
| title | TEXT | Título descriptivo |
| document_type | TEXT | resolution, annex, addendum, official_pdf, gazette |
| document_number | TEXT | Número oficial (Res. GMC 03/2020) |
| publication_date | DATE | Fecha de publicación |
| effective_date | DATE | Fecha de vigencia |
| source_url | TEXT | URL oficial del documento |
| file_path | TEXT | Path en Supabase Storage (Etapa 2+) |
| language | TEXT | es, en, pt |
| summary | TEXT | Resumen humano del alcance |
| status | TEXT | draft, active, superseded, archived |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

---

## Decisiones de diseño

1. **Entidad desde Etapa 0** — aunque no haya reglas importadas, permite registrar normas antes del seed.
2. **`status = superseded`** — cuando una resolución es reemplazada; las reglas vinculadas mantienen historial vía `RuleVersion`.
3. **`document_type` extensible** — TEXT con convención, no ENUM rígido en PostgreSQL.
4. **Clave para Knowledge Layer** — permite responder "¿qué documentos afectan a este ingrediente?" y "¿qué cambió entre versiones?".

---

## Ejemplos de uso

- Vincular todas las IngredientRules de conservantes MERCOSUR a Res. GMC 03/2020.
- Mostrar en ficha de ingrediente: "Regulado según Res. GMC 03/2020, Anexo Conservantes".
- Alertas futuras: "Nueva resolución supersede Res. 03/2020 — revisar 847 reglas afectadas".
