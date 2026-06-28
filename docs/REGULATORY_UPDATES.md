# Sprint 7 — Pipeline de Publicación Regulatoria

> Lenguaje de dominio y principios de producto: ver **`docs/DOMAIN_LANGUAGE.md`**.

## Principio de producto

**Revisión asistida con control humano** — no automatización total.

El cliente confirmó que, después de la primera carga, las actualizaciones suelen ser pequeñas (~10–20 sustancias cada ~2 años) y quiere corregir errores de interpretación, nombres químicos, ortografía o transcripción **antes** de publicar.

### Flujo obligatorio

```
1. Análisis automático/asistido   (upload → parse → normalize → validate → diff)
2. Propuesta editable             (staging en regulatory_update_items)
3. Revisión manual                (admin revisa diff + validación)
4. Corrección por el administrador (edición de campos en la propuesta)
5. Confirmación explícita         (status → ready_to_publish)
6. Publicación final              (botón manual → producción)
```

### Nunca

```
Fuente oficial → publicación directa
```

La base publicada **no se modifica** hasta que el administrador confirma la revisión **y** presiona **Publicar actualización normativa**.

## Concepto técnico

Las **Actualizaciones normativas** reemplazan el concepto técnico de ImportBatch. Cada actualización es un workspace aislado en staging.

## Flujo técnico

```
Archivo (CSV / Excel)
  → Parser (formato, hoja, cabeceras, encoding)
  → Normalizer (modelo interno BICA)
  → Validator (reporte, no detiene por advertencias)
  → Diff (publicado vs propuesta)
  → status: in_review (siempre, tras procesar)
  → Edición manual de ítems (opcional)
  → Confirmar revisión manual → ready_to_publish
  → Publicar → nueva versión normativa + historial
```

## Rutas admin

| Ruta | Descripción |
|------|-------------|
| `/app/admin/regulatory-updates` | Listado + historial |
| `/app/admin/regulatory-updates/new` | Subir archivo (solo análisis) |
| `/app/admin/regulatory-updates/[id]` | Propuesta editable, conflictos, confirmar, publicar |

## Tablas

- `regulatory_updates` — metadata y estado
- `regulatory_update_items` — staging (JSON normalizado + diff, editable)
- `regulatory_publications` — historial de versiones
- `ingredient_rules.regulatory_update_id` — trazabilidad post-publicación

## Estados

| Status | Significado |
|--------|-------------|
| `in_review` | Propuesta lista para revisar/corregir (default post-análisis) |
| `ready_to_publish` | Revisión manual confirmada — habilita publicar |
| `published` | Aplicada a producción |

## Migración

**Opción A — Supabase CLI (recomendada si tenés sesión):**

```bash
supabase login          # una sola vez
npm run db:link         # linkea el proyecto remoto
npm run db:push         # aplica migraciones pendientes
```

**Opción B — psql directo (si `db:push` falla con "Cannot find project ref"):**

Requiere `DATABASE_URL` en `.env`.

```bash
npm run db:migrate:sprint7
# o migración específica:
bash scripts/db-migrate.sh supabase/migrations/ARCHIVO.sql
```

## Formato soportado

CSV y Excel con columnas MERCOSUR (mismo esquema que seed Etapa 1A). PDF preparado en arquitectura (`source_type = 'pdf'`) — no implementado.

## Prueba rápida del pipeline

Archivo reducido para subir en `/app/admin/regulatory-updates/new`:

`data/seeds/proyecto_listados_test_sample.csv` (7 filas vs ~1893 del archivo completo)

| record_id | Tipo | Qué prueba |
|-----------|------|------------|
| R00001 | Prohibidos | Sin cambios (ya en seed) |
| R01484 | Colorantes | Sin cambios |
| R01731 | Conservantes | Con límite + advertencia de validación |
| R01804, R01800 | Restrictiva | Restricciones simples |
| R00010 | Prohibidos | **Modificado** (nombre distinto → diff update) |
| T00001 | Prohibidos | **Nuevo** (no existe → diff create) |

## Referencias

- Lenguaje de dominio: `docs/DOMAIN_LANGUAGE.md`
- Gobernanza de IA: `docs/BICA_AI_ARCHITECTURE.md`
- Disclaimers: `docs/DISCLAIMER_POLICY.md`
