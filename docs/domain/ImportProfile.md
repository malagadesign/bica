# ImportProfile

**Tabla:** `import_profiles`  
**Etapa:** 2

---

## Qué representa

Una **configuración reutilizable de importación** que define cómo transformar un archivo fuente (CSV, Excel) en entidades del dominio (`Ingredient`, `IngredientRule`, `Restriction`).

El importador **nunca hardcodea columnas ni formatos**. Cada fuente normativa tiene su perfil.

Ejemplos reales:

| name | source_type | authority |
|------|-------------|-----------|
| MERCOSUR CSV normalizado 2026 | csv | MERCOSUR |
| ANMAT Filtros UV 2025 | xlsx | ANMAT |
| Unión Europea CosIng Annex II | csv | EU |
| CSV interno manual | csv | (cualquiera) |

---

## Qué NO representa

- **No es un lote de importación** → eso es `ImportBatch` (ejecución concreta).
- **No es el archivo fuente** → el archivo se sube al batch; el profile es la receta.
- **No es un documento normativo** → es `RegulatoryDocument` (el profile puede defaultear `document_id`).

---

## Relaciones

```
ImportProfile
  ├── belongs to → RegulatoryAuthority
  ├── optional → RegulatoryDocument (documento default)
  └── has many → ImportBatch

ImportBatch
  ├── belongs to → ImportProfile
  ├── has many → ImportRow
  └── has many → ImportDiff
```

---

## Campos conceptuales (Etapa 2)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| name | TEXT | Nombre descriptivo del perfil |
| authority_id | UUID | FK → regulatory_authorities |
| document_id | UUID | FK → regulatory_documents (default) |
| source_type | TEXT | csv, xlsx, xls |
| version | TEXT | v2026.1, v1 |
| mapping_json | JSONB | Mapeo columnas/hojas → entidades |
| validation_rules_json | JSONB | Reglas de validación |
| is_active | BOOLEAN | Perfil activo |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

### Ejemplo `mapping_json` (conceptual)

```json
{
  "target_entities": ["ingredient", "ingredient_rule", "restriction"],
  "columns": {
    "inci_name": { "source": "INCI", "required": true },
    "cas_number": { "source": "CAS", "required": false },
    "list_code": { "source": "LISTA", "maps_to": "regulatory_lists.code" },
    "max_concentration": { "source": "CONCENTRACION_MAX", "entity": "restriction" },
    "warning_text": { "source": "ADVERTENCIA", "entity": "restriction" }
  },
  "sheet_mapping": {
    "Conservantes": { "list_code": "CONSERVANTES" },
    "Colorantes": { "list_code": "COLORANTES", "processor": "colorants" }
  }
}
```

---

## ImportBatch (companion entity)

**Tabla:** `import_batches`  
**Etapa:** 2

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| import_profile_id | UUID | FK |
| filename | TEXT | Archivo subido |
| status | TEXT | pending, validating, preview, committing, completed, failed, rolled_back |
| total_rows | INT | |
| processed_rows | INT | |
| successful_rows | INT | |
| failed_rows | INT | |
| error_log | JSONB | |
| user_id | UUID | FK → auth.users |
| started_at / completed_at | TIMESTAMPTZ | |

### ImportRow / ImportDiff

- **ImportRow:** trazabilidad fila cruda → entidades creadas/actualizadas.
- **ImportDiff:** snapshot before/after por registro para preview y rollback.

---

## Decisiones de diseño

1. **Reemplaza mapeo hardcodeado** del Laravel legacy (`ExcelImport::getSheetMapping()`).
2. **Nueva versión normativa = nuevo profile o nueva version** — sin cambiar código.
3. **Preview obligatorio** antes de commit transaccional.
4. **Rollback por batch_id** — revertir todo el lote.

---

## Pipeline (Etapa 2)

```
Archivo + ImportProfile
  → Parser (source_type)
  → Normalizer (mapping_json)
  → Validator (validation_rules_json)
  → Preview UI (ImportDiff)
  → Commit transaccional (IngredientRule + Restriction + RuleVersion)
  → ImportBatch.status = completed
```

---

## Ejemplos de uso

- Operador selecciona "MERCOSUR CSV normalizado 2026", sube archivo, ve preview, confirma.
- Nueva Res. MERCOSUR 2027: se crea ImportProfile v2027 con mapping actualizado.
- Rollback: operador revierte ImportBatch #42, restaura RuleVersions anteriores.
