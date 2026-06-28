# Product Review — BICA

> **⚠️ Documento histórico (Sprint 6)**  
> Snapshot previo al **Importador transaccional (Etapa 2)** y a los Sprints 7–8.  
> **No usar como referencia de estado actual.** Ver sección [Estado actual](#estado-actual-junio-2026) abajo.

Última actualización del snapshot original: Sprint 6 — Product Hardening & Client Readiness.

---

## Estado actual (junio 2026)

Desde Sprint 6 se implementó:

| Área | Sprint | Estado |
|------|--------|--------|
| Actualizaciones normativas | 7 / 7A | ✅ Pipeline completo, revisión humana, dominio contextual |
| Disclaimers y gobernanza | 8 | ✅ Aviso legal, microcopy, política interna |
| Centro de Conocimiento | KX | ✅ `/ayuda`, `/app/help`, 11 artículos MDX |

**Referencia operativa actual:**

- Usuario: `/app/help` — Centro de Conocimiento
- Admin: `docs/REGULATORY_UPDATES.md`, `docs/EDITORIAL_WORKFLOW.md`
- Producto: `docs/PRODUCT.md` (v1.1)

---

## Snapshot histórico — Sprint 6

### Estado general (Sprint 6)

**BICA** (entonces referido como Cosing AR en docs internos) era una plataforma SaaS de consulta y gestión de normativa cosmética Argentina / MERCOSUR, lista para **demostración profesional** en flujos de consulta, exploración y backoffice editorial.

Stack: Next.js 15, Supabase, Tailwind 4, shadcn/ui.

### Funcionalidades implementadas (Sprint 6)

#### Consulta y exploración (usuario final)

| Área | Estado | Rutas principales |
|------|--------|-------------------|
| Autenticación y acceso | ✅ | `/login`, `/register`, `/access-disabled` |
| Inicio con búsqueda | ✅ | `/app/dashboard` |
| Búsqueda regulatoria FTS | ✅ | `/app/search`, combobox en dashboard |
| Ingredientes regulados | ✅ | `/app/ingredients`, `/app/ingredients/[id]` |
| Knowledge Pages | ✅ | Snapshot, timeline, cross-refs, documentos |
| Listados regulatorios | ✅ | `/app/lists`, `/app/lists/[slug]` |
| Documentos normativos | ✅ | `/app/documents`, `/app/documents/[id]` |
| Reglas regulatorias | ✅ | `/app/rules`, `/app/rules/[id]` |
| Perfil propio | ✅ | `/app/profile` |

#### Administración (Sprint 6)

| Área | Estado | Rutas |
|------|--------|-------|
| Gestión de usuarios | ✅ | `/app/admin/users` |
| Workspace editorial | ✅ | `/app/admin/workspace` |
| Fichas regulatorias | ✅ | `/app/admin/ingredients` |
| Reglas / documentos (editorial) | ✅ | `/app/admin/rules`, `/app/admin/documents` |
| Flujo editorial | ✅ | Borrador → Revisión → Publicado |
| Demo ingredients + tours | ✅ | Panel en workspace |

### Pendientes en Sprint 6 (ahora resueltos o en progreso)

| Funcionalidad | Estado post-Sprint 8 |
|---------------|----------------------|
| Importador transaccional | ✅ Reemplazado por actualizaciones normativas (Sprint 7) |
| Filtro solo `published` en exploración | Parcial — revisar por sprint |
| Centro de ayuda usuario | ✅ Centro de Conocimiento (Fase KX) |

### Veredicto Sprint 6 (histórico)

**Listo para demo al cliente** en consulta regulatoria y backoffice editorial.

---

## Documentación relacionada

| Doc | Contenido |
|-----|-----------|
| `PRODUCT.md` | Visión de producto (v1.1) |
| `REGULATORY_UPDATES.md` | Actualizaciones normativas |
| `ACCESS_CONTROL.md` | Auth, roles, middleware |
| `EDITORIAL_WORKFLOW.md` | Flujo borrador/publicación |
| `content/help/` | Centro de Conocimiento (MDX) |
