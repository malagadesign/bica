# Recorridos sugeridos para demostración

Guía de navegación para presentaciones al cliente. No es un wizard interactivo: son rutas recomendadas que el presentador sigue manualmente.

Acceso rápido desde **Workspace editorial** → sección "Recorridos sugeridos".

---

## Recorrido 1 — Consulta rápida

**Objetivo:** Mostrar valor inmediato — encontrar un ingrediente y entender su estado normativo.

| Paso | Ruta | Qué mostrar |
|------|------|-------------|
| 1 | `/app/dashboard` | Búsqueda hero, métricas regulatorias |
| 2 | Buscar (ej. `Phenoxyethanol`, `77891`, `Conservantes`) | Resultados enriquecidos con estado y restricciones |
| 3 | `/app/ingredients/[id]` | Knowledge Page: snapshot, documentos, timeline |
| 4 | `/app/documents/[id]` | Documento normativo de respaldo |

**Duración sugerida:** 3–5 minutos.

**Ingredientes recomendados:** Ver panel "Ingredientes recomendados para demostración" en Workspace.

---

## Recorrido 2 — Exploración regulatoria

**Objetivo:** Navegar por categorías normativas y profundizar en un ingrediente.

| Paso | Ruta | Qué mostrar |
|------|------|-------------|
| 1 | `/app/dashboard` | Punto de partida |
| 2 | `/app/lists` | Listados regulatorios (colorantes, conservantes, etc.) |
| 3 | `/app/lists/conservantes` | Ingredientes del listado con estado |
| 4 | `/app/ingredients/[id]` | Ficha regulatoria completa |
| 5 | Sección Timeline | Evolución normativa del ingrediente |

**Duración sugerida:** 5–7 minutos.

---

## Recorrido 3 — Backoffice editorial

**Objetivo:** Demostrar cómo se publica y mantiene la normativa (solo admin).

| Paso | Ruta | Qué mostrar |
|------|------|-------------|
| 1 | `/app/admin/users` | Gestión de acceso y roles |
| 2 | `/app/admin/workspace` | Centro editorial, borradores, demo ingredients |
| 3 | `/app/admin/ingredients/[id]` | Ficha con pestañas y badges |
| 4 | Flujo editorial | Borrador → Enviar a revisión → Publicar normativa |
| 5 | Pestaña Historial | Versiones editoriales |

**Duración sugerida:** 5–8 minutos.

**Requisito:** Usuario con rol `admin`.

---

## Tips para el presentador

- Usar ingredientes del panel de demo (seleccionados automáticamente por riqueza normativa).
- Evitar términos técnicos: hablar de "ficha regulatoria", no de "registro".
- Si la búsqueda no devuelve resultados, probar con CAS o INCI exacto.
- El recorrido 3 requiere conexión estable; el editorial escribe en Supabase en tiempo real.

---

## Rutas protegidas (no mostrar al cliente)

| Ruta | Acceso |
|------|--------|
| `/app/search/qa` | Solo admin |
| `/app/admin/*` | Solo admin |
