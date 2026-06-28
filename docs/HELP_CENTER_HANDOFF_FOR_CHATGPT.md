# BICA — Centro de Ayuda: Handoff para ChatGPT

**Uso:** Copiar este archivo completo en ChatGPT. Pedir plan de acción, priorización y redacción de artículos MVP. Completar la sección **12. Respuesta para Cursor** al final y pegarla de vuelta en Cursor.

**Fecha:** 26 de junio de 2026  
**Estado del proyecto:** Plataforma BICA (Base de Ingredientes Cosméticos Argentinos) desplegada hasta **Sprint 8** (gobernanza IA + disclaimers, sin IA conectada). **No hay Help Center implementado.** Existe documentación técnica/admin en `docs/` pero casi nada orientado al usuario final.

---

## 1. Instrucciones para ChatGPT

Actuá como **product owner + technical writer + UX strategist** del proyecto BICA.

Tu tarea:

1. Revisar la **auditoría documental** incluida en este handoff (secciones 3–8).
2. Validar o refinar la **estructura propuesta del Centro de Ayuda**.
3. Proponer un **plan de implementación por fases** (sin escribir código todavía).
4. Definir el **MVP de artículos** (títulos, audiencia, fuente documental, estado de redacción).
5. Priorizar qué pantallas deben tener **ayuda contextual (`?`)** en la primera iteración.
6. Recomendar **modelo de contenido** (MDX en repo vs CMS vs híbrido) acorde al stack.
7. Identificar **deuda documental** a resolver antes o en paralelo al Help Center.
8. Responder **cada pregunta de la sección 11** con decisión explícita.
9. Indicar si el plan está **APROBADO PARA IMPLEMENTAR**, **APROBADO CON CAMBIOS** o **RECHAZADO**.
10. Completar la plantilla de respuesta de la **sección 12** para pegar en Cursor.

**Restricciones del proyecto (no negociables):**

- Stack: Next.js 15 + TypeScript + Supabase + PostgreSQL + Tailwind 4 + shadcn/ui.
- Marca de producto: **BICA** (unificar; evitar mezclar "Cosing AR" en contenido usuario).
- No implementar IA visible al cliente final en esta fase.
- No CMS externo costoso sin justificación (preferir solución simple al inicio).
- Documentación técnica interna (`docs/`, handoffs ChatGPT, arquitectura) **no debe ser pública**.
- El aviso legal canónico ya vive en `src/lib/legal/disclaimer-content.ts` y `/legal/disclaimer`.
- Alcance regulatorio actual en producción: **Argentina / MERCOSUR** (visión multi-jurisdicción en PRODUCT.md es roadmap, no implementado).
- No tocar legacy Laravel (`../cosing-ar/`).

**Lo que SÍ queremos de vos:**

- Plan accionable (sprints o fases con entregables concretos).
- Lista priorizada de artículos MVP con borrador de outline (H2/H3) para los 5–8 más críticos.
- Matriz doc existente → artículo Help Center (confirmar o corregir la del informe).
- Recomendación de naming, tono y nivel de detalle (usuario formulador vs regulatory affairs vs admin).
- Criterios de "done" para considerar el Help Center MVP listo.

---

## 2. Contexto del producto

**BICA** es una plataforma SaaS de consulta y gestión de normativa cosmética argentina / MERCOSUR. Centraliza ingredientes, reglas, restricciones, listados y documentos normativos con trazabilidad a fuentes oficiales.

| Persona | Necesidad principal |
|---------|---------------------|
| Formulador / RT | Saber si un ingrediente es viable, concentración, limitaciones |
| Regulatory affairs | Trazabilidad: documento, resolución, vigencia, historial |
| Laboratorio / QA | Búsqueda por INCI, CAS, CI |
| Admin BICA | Cargar actualizaciones normativas, workflow editorial, usuarios |

**Repo activo:** `cosing-ar-next/`  
**Deploy:** Vercel + Supabase

### Rutas UI actuales (referencia para ayuda contextual)

| Área | Rutas |
|------|-------|
| Público | `/`, `/login`, `/register`, `/legal/disclaimer`, `/access-disabled` |
| Usuario | `/app/dashboard`, `/app/search`, `/app/ingredients`, `/app/ingredients/[id]`, `/app/documents`, `/app/documents/[id]`, `/app/lists`, `/app/lists/[slug]`, `/app/rules`, `/app/rules/[id]`, `/app/profile` |
| Admin | `/app/admin/workspace`, `/app/admin/regulatory-updates`, `/app/admin/regulatory-updates/new`, `/app/admin/regulatory-updates/[id]`, `/app/admin/users`, `/app/admin/ingredients/[id]`, `/app/admin/rules/[id]`, `/app/admin/documents/[id]` |
| Interno QA | `/app/search/qa` (no público) |

### Contenido ya en la app (reutilizable)

| Asset | Ubicación | Uso potencial |
|-------|-----------|---------------|
| Disclaimer general | `src/lib/legal/disclaimer-content.ts` | Aviso legal |
| Microcopy legal | `src/lib/legal/microcopy.ts` | Fragmentos cortos |
| Ayuda contextual normativas | componente `RegulatoryContextualHelp` | Admin actualizaciones |
| Nota fuente oficial | componente `OfficialSourceNote` | Documentos / fichas |

---

## 3. Inventario documental (39 archivos `.md`)

### 3.1 Proyecto activo — `cosing-ar-next/` (37 archivos)

| # | Archivo | Ubicación | Objetivo | Estado | Audiencia |
|---|---------|-----------|----------|--------|-----------|
| 1 | README.md | raíz | Onboarding dev | Desactualizado (dice Etapa 0) | Dev |
| 2 | SETUP.md | docs/ | Setup local + Supabase | Vigente | Dev/DevOps |
| 3 | DEPLOY.md | docs/ | Deploy Vercel | Vigente | DevOps |
| 4 | PRODUCT.md | docs/ | Visión producto, personas | Parcial (visión UE/FDA no impl.) | Producto |
| 5 | PRODUCT_REVIEW.md | docs/ | Snapshot pre-Etapa 2 | Desactualizado | Producto/dev |
| 6 | ARCHITECTURE_FREEZE.md | docs/ | Contrato arquitectónico | Vigente (congelado) | Arquitectura |
| 7 | ARCHITECT-HANDOFF.md | docs/ | Brief arquitectónico v2 | Desactualizado (histórico) | Arquitectura |
| 8 | DATA_MODEL.md | docs/ | Validación DDD | Parcial | Arquitectura |
| 9 | DOMAIN_LANGUAGE.md | docs/ | Lenguaje producto normativas | Vigente | Producto/admin |
| 10 | REGULATORY_UPDATES.md | docs/ | Pipeline Sprint 7 | Vigente | Admin/dev |
| 11 | EDITORIAL_WORKFLOW.md | docs/ | Draft → review → published | Vigente | Admin |
| 12 | ACCESS_CONTROL.md | docs/ | Roles, RLS, auditoría | Vigente | Admin/dev |
| 13 | SEARCH_STRATEGY.md | docs/ | FTS, RPC | Vigente (técnico) | Dev |
| 14 | SEARCH_QA.md | docs/ | Batería QA búsqueda | Vigente (interno) | QA/dev |
| 15 | DEMO_TOURS.md | docs/ | Guiones demo | Vigente | Admin/comercial |
| 16 | DEMO_DATA.md | docs/ | Datos demo | Vigente (interno) | Admin |
| 17 | RESPONSIVE.md | docs/ | Estado responsive | Parcial | Diseño/dev |
| 18 | CLIENT_REQUIREMENTS_MAP.md | docs/ | Mapa requisitos cliente | Parcial | Producto |
| 19 | DISCLAIMER_POLICY.md | docs/ | Política disclaimers | Vigente | Legal/producto |
| 20 | BICA_AI_ARCHITECTURE.md | docs/ | Gobernanza IA | Vigente (interno) | Dev/producto |
| 21 | ETAPA_1A_REVIEW_FOR_CHATGPT.md | docs/ | Handoff histórico | Desactualizado | Dev |
| 22 | SPRINT_1B_HANDOFF_FOR_CHATGPT.md | docs/ | Handoff FTS | Desactualizado | Dev |
| 23 | SPRINT_3_HANDOFF_FOR_CHATGPT.md | docs/ | Handoff access mgmt | Parcial | Dev |
| 24 | domain/README.md | docs/domain/ | Índice entidades | Parcial (ImportBatch obsoleto) | Arquitectura |
| 25–30 | RegulatoryAuthority, RegulatoryDocument, RegulatoryList, Ingredient, IngredientRule, Restriction | docs/domain/ | Fichas entidad | Vigente (conceptual) | Arquitectura |
| 31 | ImportProfile.md | docs/domain/ | Perfil importación Etapa 2 | Desactualizado | Histórico |
| 32 | KnowledgeLayer.md | docs/domain/ | Capa futura IA/conocimiento | Vigente (roadmap) | Arquitectura |
| 33–37 | README.md | src/modules/*/ | Punteros módulos | Vigente (mínimo) | Dev |

### 3.2 Legacy — `cosing-ar/` (2 archivos, no usar)

| Archivo | Estado |
|---------|--------|
| README.md | Obsoleto (Laravel) |
| README_COSING_AR.md | Obsoleto |

---

## 4. Clasificación por audiencia

### Interno (equipo desarrollo) — NO visible usuarios

SETUP, DEPLOY, ARCHITECTURE_FREEZE, ARCHITECT-HANDOFF, DATA_MODEL, SEARCH_STRATEGY, SEARCH_QA, BICA_AI_ARCHITECTURE, handoffs ChatGPT, docs/domain/* (técnico), src/modules/*/README, RESPONSIVE, CLIENT_REQUIREMENTS_MAP, PRODUCT_REVIEW, legacy.

### Administrador — operativa

REGULATORY_UPDATES, DOMAIN_LANGUAGE, EDITORIAL_WORKFLOW, ACCESS_CONTROL, DEMO_TOURS, DEMO_DATA, partes de DISCLAIMER_POLICY.

### Usuario final — ayuda funcional

**Casi inexistente hoy.** Fuentes potenciales: PRODUCT.md (adaptar), docs/domain/*.md (glosario), DEMO_TOURS (recorridos), microcopy en app.

### Institucional — público

PRODUCT.md (intro), DOMAIN_LANGUAGE (principios), DISCLAIMER_POLICY + `/legal/disclaimer`, landing `/`.

---

## 5. Matriz de reutilización

| Documento | Acción |
|-----------|--------|
| PRODUCT.md | Adaptar → Qué es BICA, alcance |
| DOMAIN_LANGUAGE.md | Adaptar → admin + FAQ |
| REGULATORY_UPDATES.md | Dividir: flujo admin vs detalle técnico |
| EDITORIAL_WORKFLOW.md | Adaptar directo → admin |
| ACCESS_CONTROL.md | Dividir: usuario vs admin |
| DISCLAIMER_POLICY.md | Enlazar desde FAQ; texto en disclaimer-content.ts |
| docs/domain/*.md | Adaptar fuerte → glosario usuario |
| DEMO_TOURS.md | Adaptar → primeros pasos |
| DEMO_DATA, SEARCH_QA, handoffs, ARCHITECTURE_* | Privado |
| BICA_AI_ARCHITECTURE.md | Privado hasta IA visible |
| Legacy Laravel | Archivar |

---

## 6. Estructura propuesta del Centro de Ayuda (borrador)

```
Centro de Ayuda BICA
├── Primeros pasos
├── Buscar información
├── Ingredientes y fichas
├── Documentos y listados normativos
├── Glosario regulatorio
├── Administración [solo admin]
├── Preguntas frecuentes
└── Aviso legal e institucional
```

Detalle completo en auditoría interna — validar, simplificar o expandir según MVP.

---

## 7. Ayuda contextual (`?`) — pantallas candidatas

| Prioridad sugerida | Ruta | Tema |
|--------------------|------|------|
| Alta | `/app/ingredients/[id]` | Interpretar ficha, restricciones, fuentes |
| Alta | `/app/admin/regulatory-updates/new` | Incorporar normativa |
| Alta | `/app/admin/regulatory-updates/[id]` | Revisión + publicación |
| Alta | `/app/search` | Cómo buscar, tipos de resultado |
| Media | `/app/dashboard` | Primeros pasos |
| Media | `/app/documents/[id]` | Verificar fuente oficial |
| Media | `/app/admin/users` | Gestión acceso |
| Media | `/app/admin/workspace` | Workflow editorial |
| Baja | `/`, `/login` | Qué es BICA, acceso |
| No | `/app/search/qa` | Herramienta interna |

---

## 8. Deuda documental detectada

1. Naming inconsistente: "Cosing AR" vs "BICA".
2. README raíz desactualizado (Etapa 0 vs Sprint 8).
3. PRODUCT_REVIEW.md obsoleto.
4. docs/domain/ referencia ImportBatch → reemplazado por regulatory_updates.
5. PRODUCT.md mezcla alcance actual y visión futura multi-jurisdicción.
6. No hay artículos de usuario final — Help Center es redacción mayormente nueva.

---

## 9. Objetivo del sprint / iniciativa

Transformar documentación dispersa en un **Centro de Ayuda integrado** dentro de BICA, con:

- Navegación por categorías (usuario + admin + institucional).
- Artículos enlazables desde botón `?` contextual en pantallas clave.
- Separación clara: contenido público vs autenticado vs solo admin.
- Sin duplicar documentación técnica interna del repo.

**Fase actual:** planificación y definición de contenido. **No implementar código aún** salvo que el plan lo apruebe explícitamente.

---

## 10. Entregables esperados de ChatGPT

1. **Veredicto** del plan (APROBADO / CON CAMBIOS / RECHAZADO).
2. **Roadmap por fases** (Fase 0 doc cleanup, Fase 1 MVP usuario, Fase 2 admin, Fase 3 contextual help).
3. **Backlog de artículos** con: título, slug sugerido, audiencia, fuente doc, esfuerzo (S/M/L), prioridad P0/P1/P2.
4. **Outlines completos** (H2/H3) para mínimo 5 artículos P0.
5. **Recomendación técnica** de implementación (MDX, rutas, permisos por rol).
6. **Guía de tono y estilo** para redacción BICA (español AR, formal pero accesible).
7. **Lista de docs internos** a actualizar en paralelo (README, PRODUCT, domain).
8. **Riesgos** (legal, mantenimiento, desincronización UI vs ayuda).

---

## 11. Preguntas para decidir (responder todas)

| # | Pregunta |
|---|----------|
| Q1 | ¿La ruta del Help Center debe ser `/ayuda` pública + secciones admin bajo `/app/ayuda`, o todo autenticado? |
| Q2 | ¿MDX en repo (`content/help/`) es suficiente para MVP o conviene headless CMS desde el inicio? |
| Q3 | ¿Cuántos artículos máximo en MVP Fase 1 para no bloquear release? (propuesta auditoría: 8–12) |
| Q4 | ¿El glosario regulatorio es sección aparte o se integra dentro de cada artículo? |
| Q5 | ¿Qué 3 pantallas deben tener `?` en la primera iteración obligatoriamente? |
| Q6 | ¿Cómo responder FAQ de IA sin mencionar funcionalidad no visible? |
| Q7 | ¿Unificar marca "BICA" en todos los artículos aunque docs fuente digan "Cosing AR"? |
| Q8 | ¿Artículos admin visibles solo con rol admin o también a members informativos? |
| Q9 | ¿Priorizar limpieza de docs internos (README, PRODUCT_REVIEW) antes del Help Center? |
| Q10 | ¿Incluir videos/screenshots en MVP o solo texto + diagramas ASCII? |
| Q11 | ¿Cómo versionar artículos cuando cambie el producto (frontmatter `productVersion`)? |
| Q12 | ¿Qué métrica define éxito del MVP (ej. cobertura de pantallas con `?`, tiempo onboarding)? |

---

## 12. Respuesta para Cursor (plantilla — completar en ChatGPT)

```markdown
## Veredicto Help Center BICA
[APROBADO PARA IMPLEMENTAR | APROBADO CON CAMBIOS | RECHAZADO]

## Resumen ejecutivo (3–5 oraciones)


## Roadmap por fases

### Fase 0 — Limpieza documental (opcional/paralelo)
- ...

### Fase 1 — MVP usuario + institucional
- Entregables: ...
- Artículos P0: ...

### Fase 2 — Admin
- ...

### Fase 3 — Ayuda contextual (?)
- ...

## Backlog de artículos (tabla)

| Prioridad | Slug | Título | Audiencia | Fuente doc | Esfuerzo |
|-----------|------|--------|-----------|------------|----------|
| P0 | ... | ... | user/admin | ... | S/M/L |

## Outlines P0 (mínimo 5 artículos)

### Artículo: [título]
- H2: ...
- H2: ...

(repetir)

## Respuestas Q1–Q12

| # | Decisión | Justificación |
|---|----------|---------------|
| Q1 | | |
| ... | | |

## Recomendación técnica (sin código)
- Rutas: ...
- Formato contenido: ...
- Permisos: ...
- Componente `?`: ...

## Guía de tono BICA
- ...

## Docs internos a actualizar
1. ...
2. ...

## Riesgos y mitigaciones
- ...

## Criterios de "done" MVP
- [ ] ...
- [ ] ...

## Próximo prompt sugerido para Cursor
[Texto exacto que el equipo debe pegar en Cursor para iniciar implementación Fase X]
```

---

## 13. Prompt sugerido al pegar en ChatGPT

> Leé el handoff completo de BICA — Centro de Ayuda. Actuá según la sección 1. Entregá el plan completo según sección 10, respondé Q1–Q12, y completá la plantilla de la sección 12 para pegar en Cursor. Sé concreto: slugs, prioridades, outlines de artículos P0, y un roadmap de 3–4 fases con estimación relativa (S/M/L por fase). No escribas código.

---

*Generado para handoff Cursor ↔ ChatGPT — Auditoría documental y Centro de Ayuda BICA, junio 2026.*
