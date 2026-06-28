# Regulatory Updates Module (Sprint 7)

Reemplaza el concepto de ImportBatch por **Actualizaciones normativas**.

Ver `docs/REGULATORY_UPDATES.md` para el flujo completo.

```
src/modules/regulatory-updates/
  parser/       — CSV + Excel (PDF preparado)
  normalizer/   — modelo interno BICA
  validator/    — reporte sin bloqueo por advertencias
  diff/         — publicado vs propuesta
  publish/      — publicación transaccional + versión
  actions/      — server actions
  queries/      — listado y detalle
```
