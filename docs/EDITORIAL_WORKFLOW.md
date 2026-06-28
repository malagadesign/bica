# Editorial Workflow — Sprint 4

Backoffice editorial para mantener la base normativa. No es un CRUD tradicional: todo cambio pasa por workflow editorial.

## Estados

| Estado | Significado |
|--------|-------------|
| `draft` | Borrador en edición |
| `ready_for_review` | Listo para revisión interna |
| `published` | Publicado y visible en exploración |

Flujo: **Draft → Ready for Review → Published**

## Entidades con workflow

- `ingredients`
- `ingredient_rules`
- `restrictions` (columnas preparadas)
- `regulatory_documents`

Contenido seed existente queda `published` automáticamente.

## Historial

Tabla `content_revisions` — snapshots en cada guardado de borrador y transición de estado.

- Solo lectura en UI (pestaña Historial)
- Sin rollback en Sprint 4

`rule_versions` sigue existiendo para reglas (append-only, arquitectura congelada).

## Rutas admin

| Ruta | Función |
|------|---------|
| `/app/admin/workspace` | Dashboard editorial |
| `/app/admin/ingredients` | Listado ingredientes |
| `/app/admin/ingredients/[id]` | Editor con pestañas |
| `/app/admin/rules` | Listado reglas |
| `/app/admin/rules/[id]` | Editor de regla |
| `/app/admin/documents` | Listado documentos |
| `/app/admin/documents/[id]` | Editor de documento |

## Módulo

```
src/modules/editorial/
  types.ts
  queries/
  actions/
  index.ts
```

## Migración

`supabase/migrations/20250630100000_sprint_4_editorial_workflow.sql`

Aplicar después de Sprint 3.

## Pendiente (fuera de Sprint 4)

- Importador transaccional
- Rollback / diff entre versiones
- Edición inline de restricciones y sinónimos
- Filtrar exploración pública solo `published`
- IA, comparador, API pública

## Criterio de éxito

El admin publica normativa con workflow claro, sin ver IDs ni SQL, con sensación de CMS editorial (Notion/Linear), no de phpMyAdmin.
