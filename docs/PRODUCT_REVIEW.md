# Product Review — Cosing AR

Referencia de estado del producto antes de comenzar el **Importador transaccional (Etapa 2)**.

Última actualización: Sprint 6 — Product Hardening & Client Readiness.

---

## Estado general

**Cosing AR** es una plataforma SaaS de consulta y gestión de normativa cosmética Argentina / MERCOSUR. El producto está listo para **demostración profesional al cliente** en flujos de consulta, exploración y backoffice editorial.

Stack: Next.js 15, Supabase, Tailwind 4, shadcn/ui.

---

## Funcionalidades implementadas

### Consulta y exploración (usuario final)

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

### Administración

| Área | Estado | Rutas |
|------|--------|-------|
| Gestión de usuarios | ✅ | `/app/admin/users` |
| Workspace editorial | ✅ | `/app/admin/workspace` |
| Fichas regulatorias | ✅ | `/app/admin/ingredients` |
| Reglas / documentos (editorial) | ✅ | `/app/admin/rules`, `/app/admin/documents` |
| Flujo editorial | ✅ | Borrador → Revisión → Publicado |
| Historial editorial | ✅ | `content_revisions` (view-only) |
| Demo ingredients + tours | ✅ | Panel en workspace (Sprint 6) |

### Infraestructura

| Área | Estado |
|------|--------|
| RLS Supabase | ✅ |
| Middleware acceso (pending/suspended/expired) | ✅ |
| Admin gate en `/app/admin/*` y `/app/search/qa` | ✅ |
| Búsqueda RPC `search_ingredients` | ✅ |
| Seed Etapa 1A (CSV) | ✅ |

---

## Funcionalidades pendientes

| Funcionalidad | Prioridad | Notas |
|---------------|-----------|-------|
| **Importador transaccional** | Alta | Etapa 2 — siguiente hito mayor |
| Rollback / diff entre versiones | Media | Arquitectura preparada (`content_revisions`) |
| Filtrar exploración pública solo `published` | Media | Columnas editoriales existen |
| Edición inline sinónimos/restricciones | Media | Tabs estructuradas; edición vía reglas |
| IA / embeddings / chat | Baja | Fuera de roadmap inmediato |
| Pagos / suscripciones | Baja | `access_expires_at` preparado |
| API pública | Baja | |
| Comparador de ingredientes | Baja | |
| Notificaciones | Baja | |
| Mobile completo | Media | Ver `docs/RESPONSIVE.md` |

---

## Deuda técnica conocida

1. **`database.types.ts` desactualizado** — faltan columnas Sprint 4 (`editorial_status`, etc.); migraciones son source of truth.
2. **Admin guard duplicado** — cada página admin repite check; candidato a `admin/layout.tsx`.
3. **Sin tests E2E automatizados** — QA manual vía `docs/SEARCH_QA.md` y panel `/app/search/qa`.
4. **`rule_versions` vs `content_revisions`** — dos sistemas de historial; unificar criterio al importar.
5. **Search index** — no expone `document_count` en RPC; enriquecimiento parcial en UI.
6. **Landing `/`** — copy "Etapa 0"; actualizar para cliente final.

---

## Mejoras UX futuras

- Onboarding guiado post-login (sin wizard pesado)
- Favoritos / historial de consultas
- Export PDF de ficha regulatoria
- Comparación lado a lado de ingredientes
- Filtros avanzados en listados
- Dark mode refinado en knowledge cards
- Accesibilidad WCAG audit completo

---

## Próximos sprints sugeridos

| Sprint | Foco |
|--------|------|
| **7 — Importador Etapa 2** | CSV transaccional, batches, validación, needs_review automático |
| **8 — Publicación y RLS** | Solo contenido `published` en exploración pública |
| **9 — Mobile** | Sidebar drawer, tablas → cards, touch targets |
| **10 — API / integraciones** | API lectura, webhooks, export |

---

## Riesgos abiertos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Seed desincronizado con producción | Demo inconsistente | Panel demo ingredients; `DEMO_DATA.md` |
| Contenido `draft` visible en exploración | Confusión cliente | Sprint 8 — filtro published |
| Sin backup/rollback editorial | Pérdida de cambios | `content_revisions`; rollback Sprint futuro |
| Dependencia Supabase project único | Single point of failure | Backups Supabase; staging env |
| Acceso admin por email hardcoded en docs | Seguridad operativa | Rotar credenciales; 2FA Supabase |

---

## Criterios de demo (Sprint 6)

Un usuario nuevo debe poder, sin ayuda técnica:

- [x] Iniciar sesión
- [x] Encontrar un ingrediente (búsqueda o listado)
- [x] Comprender estado regulatorio (snapshot < 5 seg)
- [x] Navegar a documentos normativos
- [x] Explorar listados regulatorios
- [x] (Admin) Comprender flujo editorial
- [x] (Admin) Identificar gestión de usuarios

Ver recorridos en `docs/DEMO_TOURS.md`.

---

## Documentación relacionada

| Doc | Contenido |
|-----|-----------|
| `ACCESS_CONTROL.md` | Auth, roles, middleware |
| `EDITORIAL_WORKFLOW.md` | Flujo borrador/publicación |
| `SEARCH_QA.md` | Batería de pruebas búsqueda |
| `DEMO_TOURS.md` | Recorridos presentación |
| `DEMO_DATA.md` | Datos demo y enriquecimiento |
| `RESPONSIVE.md` | Mobile pendientes |

---

## Veredicto

**Listo para demo al cliente** en consulta regulatoria y backoffice editorial. **No listo** para producción masiva sin Importador Etapa 2 y filtro de contenido publicado.
