# Cosing AR — Mapa de requerimientos del cliente

**Sprint:** 1C — Validación producto  
**Fuente:** `docs/lo que quiero.pptx` (PPT cliente, junio 2026)  
**Estado app:** post Sprint 1B (búsqueda FTS operativa)  
**Fecha:** 28 de junio de 2026

---

## Leyenda

| Estado | Significado |
|--------|-------------|
| **Cubierto** | Implementado y usable en `cosing-ar-next` |
| **Parcial** | Existe en parte; falta UX, datos o alcance del PPT |
| **Pendiente** | No implementado; planificado o backlog |
| **No recomendable** | Requiere alternativa técnica/legal distinta al PPT literal |

---

## Mapa requerimiento por requerimiento

### 1. Pantalla de bienvenida

| | |
|---|---|
| **PPT** | Slide 1 — “Pantalla de bienvenida” |
| **Estado** | **Parcial** |
| **Hoy** | Landing pública en `/` con propuesta de valor, CTA Ingresar/Registrarse |
| **Gap** | No replica el diseño/visual del PPT; no es pantalla post-auth de “bienvenida” personalizada |
| **Sprint sugerido** | 2+ — diseño alineado al PPT tras validar copy |

---

### 2. Login / registro

| | |
|---|---|
| **PPT** | Slide 2 — “Pantalla de logueo o registro” |
| **Estado** | **Parcial** |
| **Hoy** | `/login`, `/register` con Supabase Auth (email + password) |
| **Gap** | El cliente pide registro sin password manual (slide 4); flujo actual es estándar email/pass |
| **Sprint sugerido** | 2 — auth admin-provisioned |

---

### 3. Pantalla post-login con listados Argentina / MERCOSUR

| | |
|---|---|
| **PPT** | Slide 3 — grid de listados al pasar el login |
| **Estado** | **Parcial** |
| **Hoy** | Dashboard con búsqueda + métricas; sidebar con Inicio, Búsqueda, Ingredientes, Reglas, Pendientes |
| **Gap** | No hay pantalla hub de listados como en el PPT (Colorantes, Conservantes, Filtros solares, etc.) |
| **Datos** | Listas cargadas en DB vía seed 1A; consultables por búsqueda (`filtros uv`, `prohibidos`) pero no navegación por listado |
| **Sprint sugerido** | **2 — Filtros + navegación por listados regulatorios** |

Listados mencionados en PPT vs datos:

| Listado PPT | En CSV/DB | Navegable UI |
|-------------|-----------|--------------|
| Colorantes | Sí | No (solo búsqueda) |
| Conservantes | Sí | No |
| Filtros solares | Sí (Filtros UV) | No |
| Formaldehído | Sí | No |
| Microperlas | Sí | No |
| Prohibidos GBL | Parcial | No |
| Prohibidos Metacrilato Arg | Parcial | No |
| Prohibidos | Sí | No |
| Repelentes | Sí | No |
| Restricción Argentina | Parcial | No |
| Restrictiva | Sí | No |
| Triclosan | Sí | No |
| Uñas artificiales | Sí | No |

---

### 4. Pantalla de detalle por listado (ej. Conservantes)

| | |
|---|---|
| **PPT** | Slide 5 — “Pantalla de conservantes” |
| **Estado** | **Pendiente** |
| **Hoy** | Perfil ingrediente + perfil regla; no vista “listado conservantes” |
| **Sprint sugerido** | 2 |

---

### 5. Registro con WhatsApp

| | |
|---|---|
| **PPT** | Slide 4 — “Agregaría whatsapp” |
| **Estado** | **Pendiente** |
| **Hoy** | Sin campo WhatsApp en registro |
| **Nota** | Legacy Laravel menciona “Priority WhatsApp support” en planes — distinto a registro |
| **Sprint sugerido** | 2–3 — campo opcional + notificación manual admin |

---

### 6. Usuario generado por admin / sin password manual

| | |
|---|---|
| **PPT** | Slide 4 — “Sacar el Pass, ya que yo se lo voy a generar” |
| **Estado** | **Pendiente** |
| **Hoy** | Registro self-service con password |
| **Alternativa recomendada** | Admin crea usuario en Supabase Dashboard o script; magic link / password temporal por email |
| **Sprint sugerido** | 2 — panel admin mínimo o flujo invite-only |

---

### 7. Control manual de acceso (habilitar/deshabilitar usuarios)

| | |
|---|---|
| **PPT** | Slide 6 — “incluir o sacar usuarios de la base”; pago por fuera |
| **Estado** | **Pendiente** |
| **Hoy** | RLS por `authenticated`; sin flag `is_active` en profiles ni bloqueo por admin |
| **Alternativa recomendada** | `profiles.access_enabled` + middleware; gestión manual en Supabase hasta panel admin |
| **Sprint sugerido** | 2 — control de acceso |

---

### 8. Edición simple de bases (CRUD + publicar)

| | |
|---|---|
| **PPT** | Slide 6 — editar ingredientes, agregar, quitar, “actualizar y quede publicado” |
| **Estado** | **Pendiente** |
| **Hoy** | Solo lectura; seed CSV idempotente (Etapa 1A), no editor |
| **Nota arquitectura** | Etapa 2 = importador transaccional; edición inline es scope distinto |
| **Sprint sugerido** | 3+ — editor simple post-importador |

---

### 9. Control de sesiones simultáneas (misma cuenta, múltiples IP)

| | |
|---|---|
| **PPT** | Slide 6 — “no conectar con el mismo usuario desde 2 o más IP” |
| **Estado** | **No recomendable / requiere alternativa** |
| **Por qué** | Supabase Auth no limita sesiones por IP nativamente; requiere tabla de sesiones activas + heartbeat + revocación |
| **Alternativa** | Límite de dispositivos concurrentes (2), sesión única con kick, o watermark + auditoría |
| **Sprint sugerido** | 3+ — diseño de política de sesión |

---

### 10. Seguridad anti export / anti copy / anti captura

| | |
|---|---|
| **PPT** | Slide 6 — “no exportar, ni copy/paste, ni captura de pantalla” |
| **Estado** | **No recomendable / requiere alternativa** |
| **Por qué** | Copy/paste y captura **no son bloqueables** de forma fiable en web (DevTools, OCR, foto de pantalla) |
| **Hoy** | No hay export CSV/Excel en Next app; datos visibles en HTML (inevitable para consulta) |
| **Alternativa recomendada** | Watermark por usuario, rate limiting, auditoría de consultas, DLP parcial (CSS user-select + disclaimer legal), no prometer bloqueo total |
| **Sprint sugerido** | 3+ — disuasión, no bloqueo absoluto |

---

## Funcionalidades actuales NO pedidas en PPT pero ya implementadas

| Funcionalidad | Estado |
|---------------|--------|
| Búsqueda FTS (INCI, CAS, CI, sinónimos, listas, restricciones) | Cubierto |
| Dashboard con métricas | Cubierto |
| Catálogo ingredientes | Cubierto |
| Perfil ingrediente + reglas | Cubierto |
| Perfil regla + restricciones | Cubierto |
| Filtro reglas pendientes de revisión | Cubierto |
| Página `/app/search` | Cubierto |

---

## Priorización sugerida post-1C

| Prioridad | Tema | Sprint |
|-----------|------|--------|
| P0 | Hub listados Argentina/MERCOSUR post-login | 2 |
| P0 | Navegación/filtro por listado regulatorio | 2 |
| P1 | Auth admin-provisioned (sin pass cliente) | 2 |
| P1 | Control acceso manual (enable/disable user) | 2 |
| P2 | WhatsApp en registro | 2–3 |
| P2 | Pantallas alineadas al PPT (visual) | 2–3 |
| P3 | Editor simple de bases | 3+ |
| P3 | Sesiones concurrentes | 3+ |
| P3 | Anti-copy/export (disuasión) | 3+ |

---

## Referencias

- PPT cliente: `docs/lo que quiero.pptx`
- Producto: `docs/PRODUCT.md`
- Arquitectura: `docs/ARCHITECTURE_FREEZE.md`
- Búsqueda: `docs/SEARCH_STRATEGY.md`
- QA búsqueda: `docs/SEARCH_QA.md`
