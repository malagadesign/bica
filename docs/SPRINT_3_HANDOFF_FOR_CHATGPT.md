# Cosing AR — Sprint 3 (Access Management) Handoff para ChatGPT

**Uso:** Copiar este archivo completo en ChatGPT. Pedir revisión, refinamiento o implementación guiada. Completar la sección **14. Respuesta para Cursor** al final y pegarla de vuelta en Cursor.

**Fecha:** 29 de junio de 2026  
**Estado del proyecto:** Sprints 1A–1C, 2 y 3 **implementados en código**. Sprint 3 **pendiente de refactor** al módulo `src/modules/admin/users/` según ampliación técnica acordada. Migración SQL lista; aplicar en Supabase si aún no se hizo.

---

## 1. Instrucciones para ChatGPT

Actuá como **arquitecto backend + security engineer + product owner técnico** del proyecto Cosing AR.

Tu tarea:

1. Revisar la implementación y el plan de **Sprint 3 — Access Management**.
2. Validar estrategia RLS híbrida (`is_admin()` + service role acotado).
3. Revisar migración SQL, middleware, flujo de registro y panel admin.
4. Proponer refactor a `src/modules/admin/users/` con acciones granulares.
5. Detectar riesgos de seguridad, RLS recursivo, o exposición de service role.
6. Responder **cada pregunta de la sección 13** con decisión explícita.
7. Indicar si el sprint está **APROBADO**, **APROBADO CON CAMBIOS** o **RECHAZADO**.
8. Completar la plantilla de respuesta de la **sección 14** para pegar en Cursor.

**Restricciones del proyecto (no negociables):**

- Stack: Next.js 15 + TypeScript + Supabase + PostgreSQL + Tailwind 4 + shadcn/ui.
- No Stripe, Mercado Pago, pagos automáticos, facturación, planes comerciales complejos.
- No anti-captura, anti-copy, DRM, bloqueo por IP.
- No IA, API pública, edición de ingredientes, importador transaccional.
- No tocar legacy Laravel (`cosing-ar/` en otro directorio).
- `SUPABASE_SERVICE_ROLE_KEY` **nunca** al cliente (`NEXT_PUBLIC_*` prohibido).
- Pagos al inicio: **manual, fuera de la plataforma**.
- Control de acceso: admin habilita/suspende usuarios manualmente.

---

## 2. Contexto del proyecto

**Cosing AR** es una plataforma SaaS regulatoria para consulta de ingredientes cosméticos (MERCOSUR/ANMAT/UE, etc.).

| Capa | Rol |
|------|-----|
| Documento normativo oficial | Fuente legal |
| CSV normalizado del cliente | Fuente operativa de carga |
| PostgreSQL (Supabase) | Fuente de consulta en runtime |

**Repo activo:** `cosing-ar-next/`  
**Contrato arquitectónico:** `docs/ARCHITECTURE_FREEZE.md` v1.0 (CONGELADO)  
**Supabase project ref:** `einnzgvdlmotkjebcadm`

### Stack

```
Next.js 15.5.19
React 19
TypeScript 5
Supabase (@supabase/ssr + @supabase/supabase-js)
Tailwind CSS 4
shadcn/ui
```

### Scripts

```bash
npm run dev
npm run lint
npm run build
npm run seed:csv
```

### Variables de entorno relevantes

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # o ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=              # solo servidor
PUBLIC_REGISTRATION_ENABLED=true        # false = acceso por invitación
```

---

## 3. Sprints completados (resumen)

| Sprint | Estado | Entregable principal |
|--------|--------|----------------------|
| Etapa 0 | ✅ | Schema inicial, auth, profiles básico |
| Etapa 1A | ✅ | ingredient_rules, restrictions, seed CSV (~1.783 ingredientes, ~1.893 reglas) |
| Sprint 1A | ✅ | UX búsqueda ILIKE, dashboard, perfiles |
| Sprint 1B | ✅ | FTS: VIEW `ingredient_search_index`, RPC `search_ingredients` |
| Sprint 1C | ✅ | QA búsqueda, aliases, `docs/SEARCH_QA.md`, `/app/search/qa` |
| Sprint 2 | ✅ | Regulatory Explorer: `/app/lists`, `/app/documents`, breadcrumbs |
| Sprint 3 | ✅ código / ⏳ refactor módulo | Access Management manual |

### Datos seed (referencia)

| Entidad | Cantidad |
|---------|----------|
| Ingredientes | ~1.783 |
| Reglas | ~1.893 |
| Restricciones | ~443 |
| needs_review | ~239 |
| Documentos | ~17 |

---

## 4. Objetivo Sprint 3

Sistema básico pero sólido de **gestión de acceso manual**. Al finalizar:

1. Admin ve usuarios registrados.
2. Admin activa o suspende usuarios.
3. Admin crea usuarios manualmente o aprueba registros.
4. Se ve email, nombre, WhatsApp y estado.
5. Usuarios suspendidos/pending no acceden a `/app/*`.
6. Última actividad básica (`last_seen_at`, `last_login_at`).
7. Modelo preparado para suscripciones futuras (`access_expires_at`).

**Cliente pidió explícitamente:**

- Habilitar/quitar usuarios manualmente.
- Pago por fuera de la plataforma al inicio.
- Control total sobre quién accede.
- WhatsApp en registro.
- Evitar compartir cuenta (base técnica documentada, sin bloqueo IP).
- Admin simple.

---

## 5. Modelo de datos — `profiles` extendido

Migración: `supabase/migrations/20250629100000_sprint_3_access_management.sql`

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `full_name` | TEXT | — | Nombre |
| `whatsapp` | TEXT | — | Contacto (registro) |
| `role` | TEXT | `member` | `admin` \| `member` |
| `access_status` | TEXT | `pending` | `active` \| `suspended` \| `pending` |
| `access_expires_at` | TIMESTAMPTZ | NULL | Vencimiento manual / futura suscripción |
| `last_seen_at` | TIMESTAMPTZ | NULL | Última actividad en `/app/*` |
| `last_login_at` | TIMESTAMPTZ | NULL | Último login |
| `notes` | TEXT | NULL | Notas internas (solo admin) |
| `created_at` / `updated_at` | TIMESTAMPTZ | now() | Auditoría |

### Trigger `handle_new_user`

Al registrarse vía Supabase Auth:

```sql
INSERT INTO profiles (id, full_name, whatsapp, role, access_status)
VALUES (NEW.id, metadata.full_name, metadata.whatsapp, 'member', 'pending');
```

Usuarios **preexistentes** (antes del sprint): migración los deja `access_status = active`.

---

## 6. Estrategia RLS — decisión acordada

### Modelo híbrido (confirmado en plan, pendiente validación ChatGPT)

| Operación | Mecanismo |
|-----------|-----------|
| Leer/escribir `profiles` (admin autenticado) | **RLS + `public.is_admin()`** |
| `listUsers` (necesita email de `auth.users`) | **Service role** en Server Action |
| `createUserByAdmin` (Auth Admin API) | **Service role** en Server Action |
| Usuario actualiza su perfil básico | RLS `profiles_update_own_basic` |

### Función `is_admin()` — evitar recursión

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

**Por qué no recursivo:** `SECURITY DEFINER` lee `profiles` con privilegios del owner de la función, sin re-evaluar policies RLS del caller.

### Policies

```sql
-- SELECT: propio perfil OR admin
profiles_select_own_or_admin

-- UPDATE: usuario solo campos básicos; no puede cambiar role/access_status/notes/expires
profiles_update_own_basic

-- ALL: admin gestiona cualquier perfil
profiles_admin_manage  →  USING/WITH CHECK (public.is_admin())
```

### Service role — cuándo y dónde

```
src/lib/supabase/admin.ts          ← createAdminClient() SOLO servidor
src/modules/admin/users/          ← Server Actions que lo invocan
```

**Nunca:** componentes `"use client"`, API routes públicas, env `NEXT_PUBLIC_*`.

---

## 7. Control de acceso — middleware

Archivo: `src/lib/supabase/middleware.ts`

```
1. Sin sesión + /app/*           →  /login?redirectTo=...
2. Con sesión: leer profile      →  role, access_status, access_expires_at
3. isAccessAllowed(profile):
     access_status === 'active'
     AND (access_expires_at IS NULL OR access_expires_at > now())
4. /app/* + NOT allowed          →  /access-disabled
5. /app/admin/* + role !== admin →  /app/dashboard
6. /access-disabled + allowed    →  /app/dashboard
7. /login|/register + sesión     →  dashboard o access-disabled según estado
```

### Matriz de acceso

| Estado | `/app/*` | `/access-disabled` |
|--------|----------|---------------------|
| `pending` | ❌ | ✅ "pendiente de aprobación" |
| `suspended` | ❌ | ✅ "cuenta suspendida" |
| `active` + no vencido | ✅ | ❌ redirect dashboard |
| `active` + vencido | ❌ | ✅ mensaje vencimiento |

Página: `/access-disabled` — `src/app/access-disabled/page.tsx`

---

## 8. Registro y login

### Registro (`/register`)

Campos: nombre, email, WhatsApp, contraseña.

Flujo:

1. `signUp` con `user_metadata: { full_name, whatsapp }`
2. Trigger crea profile `pending`
3. Redirect → `/access-disabled`
4. Admin activa en `/app/admin/users`

Flag: `PUBLIC_REGISTRATION_ENABLED=false` → mensaje "El acceso se gestiona por invitación."

Archivos:

- `src/app/(auth)/register/page.tsx`
- `src/components/auth/register-form.tsx`
- `src/app/(auth)/actions.ts` → `register()`

### Login

Actualiza `last_login_at` y `last_seen_at` en profile tras login exitoso.

---

## 9. Panel admin

**Ruta:** `/app/admin/users`  
**Sidebar:** sección "Administración → Usuarios" solo si `profile.role === 'admin'`

### Funcionalidades actuales

- Listado con búsqueda (email, nombre, WhatsApp)
- Badges: active / suspended / pending / admin / member
- Acciones rápidas: Activar, Suspender, Pendiente
- Edición: rol, WhatsApp, notas, vencimiento
- Alta manual vía Supabase Auth Admin API

### Cómo se determina admin

```
auth.getUser() → user.id
SELECT role FROM profiles WHERE id = user.id
role === 'admin' → isAdmin
```

Usado en: middleware, `app/layout.tsx` (sidebar), Server Actions (`requireAdminProfile()`), RLS DB.

### Promover primer admin (SQL manual)

```sql
UPDATE public.profiles
SET role = 'admin', access_status = 'active'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu@email.com'
);
```

---

## 10. Estado actual del código (Sprint 3)

### Implementado ✅

```
supabase/migrations/20250629100000_sprint_3_access_management.sql
docs/ACCESS_CONTROL.md

src/lib/auth/config.ts                    — PUBLIC_REGISTRATION_ENABLED
src/lib/auth/profile.ts                   — UserProfile, isAccessAllowed, requireAdminProfile
src/lib/supabase/admin.ts                 — createAdminClient (service role)
src/lib/supabase/middleware.ts            — bloqueo access_status
src/lib/data/admin-users.ts               — listAdminUsers, createAdminUser, updateAdminUser

src/app/access-disabled/page.tsx
src/app/(auth)/actions.ts                 — register con WhatsApp, last_login_at
src/app/app/admin/users/page.tsx
src/app/app/admin/users/actions.ts        — createUserAction, updateUserAction, quickSetAccessStatus
src/components/admin/users-panel.tsx
src/components/admin/access-badges.tsx
src/components/layout/app-sidebar.tsx     — sección admin condicional
src/components/layout/app-layout-shell.tsx
src/app/app/layout.tsx                    — isAdmin + touchLastSeen
```

### Pendiente refactor ⏳ (ampliación técnica acordada)

Mover a módulo:

```
src/modules/admin/users/
├── actions/
│   ├── list-users.ts
│   ├── update-user-access-status.ts
│   ├── update-user-role.ts
│   ├── update-user-notes.ts
│   ├── update-user-whatsapp.ts
│   ├── update-user-expiration.ts
│   └── create-user-by-admin.ts
├── queries/
│   ├── list-users.ts
│   └── update-profile.ts
├── types.ts
└── index.ts
```

Eliminar/deprecar:

- `src/lib/data/admin-users.ts`
- `src/app/app/admin/users/actions.ts`

---

## 11. Rutas de la aplicación (post Sprint 2 + 3)

| Ruta | Auth | Acceso | Función |
|------|------|--------|---------|
| `/` | No | Público | Landing |
| `/login` | No | Público | Login |
| `/register` | No | Público* | Registro (*si flag habilitado) |
| `/access-disabled` | Sí | pending/suspended | Acceso bloqueado |
| `/app/dashboard` | Sí | active | Dashboard + hero search |
| `/app/search` | Sí | active | Resultados búsqueda FTS |
| `/app/lists` | Sí | active | Listados regulatorios |
| `/app/lists/[slug]` | Sí | active | Detalle lista + filtros |
| `/app/documents` | Sí | active | Documentos normativos |
| `/app/documents/[id]` | Sí | active | Ficha documento |
| `/app/ingredients` | Sí | active | Catálogo ingredientes |
| `/app/ingredients/[id]` | Sí | active | Perfil ingrediente |
| `/app/admin/users` | Sí | active + admin | Gestión usuarios |
| `/app/rules` | Sí | active | Reglas (sin sidebar, legacy) |
| `/app/search/qa` | Sí | active | QA interno búsqueda |

### Sidebar (Explorar)

Dashboard · Buscar · Listados · Documentos · Ingredientes

### Sidebar (Administración — solo admin)

Usuarios

---

## 12. Criterios de aceptación obligatorios

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Admin puede ver usuarios | ✅ |
| 2 | Admin puede activar/suspender | ✅ |
| 3 | Usuario suspended no entra `/app/*` | ✅ middleware |
| 4 | Usuario pending no entra `/app/*` | ✅ middleware |
| 5 | Usuario active entra correctamente | ✅ |
| 6 | WhatsApp en registro/admin | ✅ |
| 7 | Sidebar admin solo para admin | ✅ |
| 8 | Service role no expuesto al cliente | ✅ |
| 9 | `npm run lint` OK | ✅ |
| 10 | `npm run build` OK | ✅ |
| 11 | Refactor a `src/modules/admin/users/` | ⏳ pendiente |
| 12 | Acciones granulares separadas | ⏳ pendiente |

---

## 13. Preguntas abiertas para ChatGPT

Respondé cada una con **APROBAR / RECHAZAR / MODIFICAR** + justificación:

1. **¿La estrategia RLS híbrida** (`is_admin()` + service role solo para Auth Admin API) es correcta?

2. **¿`profiles_update_own_basic` con subqueries** a `profiles` es segura o conviene simplificar?

3. **¿Conviene migrar `updateUser*` a cliente autenticado admin (RLS)** y reservar service role solo para `listUsers` + `createUserByAdmin`?

4. **¿`touchLastSeen` en cada request de `app/layout.tsx`** es aceptable o conviene throttling?

5. **¿El default `pending` para nuevos registros** es correcto para el flujo del cliente?

6. **¿Falta página de perfil propio** donde el usuario edite `full_name` y `whatsapp`?

7. **¿La migración debe incluir tabla `user_sessions`** ahora o documentar solo?

8. **¿Hay riesgo** de que un member eleve privilegios vía manipulación de requests?

9. **¿Qué mejoras harías** al panel admin antes de producción?

10. **¿El sprint está APROBADO**, **APROBADO CON CAMBIOS** o **RECHAZADO**?

---

## 14. Respuesta para Cursor (plantilla — completar en ChatGPT)

```markdown
## Veredicto Sprint 3
[APROBADO | APROBADO CON CAMBIOS | RECHAZADO]

## Cambios obligatorios antes de cerrar sprint
1. ...
2. ...

## Respuestas sección 13
1. ...
2. ...
...

## Refactor src/modules/admin/users/ — orden recomendado
1. ...
2. ...

## SQL: cambios a la migración (si aplica)
[pegar SQL corregido]

## Riesgos residuales
- ...

## QA manual — checklist
- [ ] Registrar usuario → pending → /access-disabled
- [ ] Admin activa → acceso /app/dashboard
- [ ] Admin suspende → redirect /access-disabled
- [ ] access_expires_at vencido → bloqueado
- [ ] No-admin no ve /app/admin/users
- [ ] createUserByAdmin funciona
- [ ] PUBLIC_REGISTRATION_ENABLED=false oculta registro

## Notas operativas
- Cómo promover primer admin
- Cómo aplicar migración en Supabase
```

---

## 15. Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| `docs/ACCESS_CONTROL.md` | Acceso manual, roles, IP, anti-copia, suscripciones |
| `docs/ARCHITECTURE_FREEZE.md` | Contrato arquitectónico congelado |
| `docs/CLIENT_REQUIREMENTS_MAP.md` | Requerimientos cliente vs estado |
| `docs/SEARCH_STRATEGY.md` | Búsqueda FTS |
| `docs/SEARCH_QA.md` | 20 queries QA búsqueda |
| `docs/SETUP.md` | Setup local + migraciones |
| `docs/SPRINT_1B_HANDOFF_FOR_CHATGPT.md` | Handoff Sprint 1B (formato referencia) |

---

## 16. Migración SQL completa (referencia)

Archivo: `supabase/migrations/20250629100000_sprint_3_access_management.sql`

Contenido principal:

- `ALTER TABLE profiles` — columnas whatsapp, role, access_status, access_expires_at, last_seen_at, last_login_at, notes
- CHECK constraints role / access_status
- Índices role, access_status, last_seen_at
- UPDATE usuarios existentes → active
- `handle_new_user()` actualizado
- `is_admin()` SECURITY DEFINER
- Policies: select own/admin, update own basic, admin manage all

Ver archivo en repo para SQL completo.

---

## 17. Flujos de datos

### Registro

```
[RegisterForm] → register() Server Action
      ↓ signUp + metadata { full_name, whatsapp }
[auth.users INSERT] → trigger handle_new_user → profiles (pending)
      ↓
redirect /access-disabled
```

### Acceso app

```
[Request /app/*] → middleware
      ↓ getUser + SELECT profile
isAccessAllowed? → NO → /access-disabled
                 → SÍ → continuar
[app/layout.tsx] → touchLastSeen()
```

### Admin listUsers

```
[UsersPanel] → listUsers() Server Action
      ↓ requireAdminProfile()
[createAdminClient()] → auth.admin.listUsers() + profiles SELECT
      ↓ merge by id
[AdminUserRow[]] → UI
```

### Admin updateUser

```
[UsersPanel form] → updateUserAction() Server Action
      ↓ requireAdminProfile()
[createClient() autenticado] → profiles UPDATE (RLS is_admin)
   — o —
[createAdminClient()] → profiles UPDATE (si RLS insuficiente)
```

---

## 18. Lo que NO implementar (Sprint 3)

- Stripe / Mercado Pago / webhooks de pago
- Facturación / planes comerciales
- Bloqueo por IP
- Anti-copy / anti-captura / DRM
- Tabla `user_sessions` (documentada como futura)
- RBAC complejo (solo admin/member)
- Edición ingredientes / importador / IA / API pública

---

*Generado para handoff Cursor ↔ ChatGPT — Sprint 3 Access Management, junio 2026.*
