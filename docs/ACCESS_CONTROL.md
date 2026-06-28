# Control de acceso — Cosing AR

Sprint 3 implementa gestión manual de acceso. Los pagos se administran por fuera de la plataforma; el campo `access_expires_at` queda preparado para suscripciones futuras.

## Modelo de datos

### `profiles`

| Campo | Descripción |
|-------|-------------|
| `full_name` | Nombre del usuario |
| `whatsapp` | Contacto (obligatorio en registro) |
| `role` | `admin` \| `member` |
| `access_status` | `active` \| `suspended` \| `pending` |
| `access_expires_at` | Vencimiento manual o futura suscripción |
| `last_seen_at` | Última actividad en `/app/*` (throttle 5 min) |
| `last_login_at` | Último inicio de sesión |
| `notes` | Notas internas (solo admin) |

### `admin_audit_log`

Auditoría básica de cambios administrativos:

| Campo | Descripción |
|-------|-------------|
| `admin_id` | Quién realizó el cambio |
| `target_user_id` | Usuario afectado |
| `action` | `role_changed`, `access_status_changed`, `access_expires_at_changed` |
| `old_value` / `new_value` | JSON con el valor anterior y nuevo |
| `created_at` | Cuándo |

Migración: `20250629110000_sprint_3_audit_and_rls_hardening.sql`

### Flujo de registro

1. Usuario se registra → `access_status = pending`
2. Admin revisa en `/app/admin/users`
3. Admin activa → `access_status = active`
4. Usuario puede acceder a `/app/*`

### Configuración

```bash
PUBLIC_REGISTRATION_ENABLED=true   # false = solo invitación
```

## Estrategia RLS (híbrida)

| Operación | Mecanismo |
|-----------|-----------|
| Leer/escribir `profiles` (admin) | Cliente autenticado + RLS + `public.is_admin()` |
| Usuario edita perfil propio | RLS + trigger `protect_profile_admin_fields` |
| Listar emails | Service role — `auth.admin.listUsers()` |
| Crear usuario | Service role — `auth.admin.createUser()` |
| Auditoría admin | Cliente autenticado admin + RLS en `admin_audit_log` |

`is_admin()` es `SECURITY DEFINER` para evitar recursión RLS.

Service role vive en `src/lib/supabase/admin.ts` — **nunca** en cliente.

## Módulos

```
src/modules/admin/users/   — gestión admin de usuarios
src/modules/profile/       — edición de perfil propio (/app/profile)
```

## Middleware

Reglas en rutas privadas:

- Sin sesión → `/login`
- `access_status !== active` → `/access-disabled`
- `access_expires_at` vencido → `/access-disabled`
- `/app/admin/*` → solo `role = admin`

## Rutas

| Ruta | Función |
|------|---------|
| `/app/profile` | Editar nombre y WhatsApp propios |
| `/app/admin/users` | Panel admin de usuarios |
| `/access-disabled` | Acceso bloqueado |

## Promover el primer admin

```sql
UPDATE public.profiles
SET role = 'admin', access_status = 'active'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tu@email.com'
);
```

## `user_sessions` — diferido

No se implementa en Sprint 3. Queda documentado para un sprint futuro:

- Tabla opcional con `user_id`, `ip_hash`, `user_agent`, `last_seen_at`
- Objetivo: auditoría de dispositivos y límite de sesiones activas
- **No** bloqueo por IP en esta etapa

## Compartir cuentas — por qué no bloqueamos por IP

- Las IP cambian (móvil, WiFi, 4G)
- VPNs y proxies son habituales
- Oficinas comparten IP pública
- Un mismo usuario legítimo usa notebook y celular
- Bloqueo por IP genera falsos positivos

### Alternativas futuras

- Limitar sesiones activas simultáneas (`user_sessions`)
- Marca de agua con email del usuario
- Alertas por actividad sospechosa
- Rate limit y límites de consultas
- Términos de uso sobre compartir credenciales

## Anti-copia / anti-captura

No existe forma confiable de impedir copy/captura de contenido visible.

### Alternativas futuras

- Marca de agua con email + timestamp
- Logs de acceso y auditoría
- Límites de exportación
- Rate limiting
- Términos de uso

## Suscripciones futuras (Sprint posterior)

Campos preparados:

- `access_expires_at`
- `notes` (referencia a pago manual)

Integraciones futuras: Stripe / Mercado Pago, webhooks, planes comerciales.

## Seguridad operativa

- `SUPABASE_SERVICE_ROLE_KEY` nunca al cliente
- Server Actions validan `requireAdminProfile()`
- Trigger DB impide que members cambien `role`, `access_status`, `notes`, `access_expires_at`
- `last_seen_at` con throttle de 5 minutos para reducir escrituras

## QA manual

- [ ] Registrar → pending → `/access-disabled`
- [ ] Admin activa → acceso dashboard
- [ ] Admin suspende → redirect `/access-disabled`
- [ ] `access_expires_at` vencido → bloqueado
- [ ] Member no accede `/app/admin/users`
- [ ] Member no puede cambiar role vía DevTools (trigger + RLS)
- [ ] `createUserByAdmin` funciona
- [ ] `PUBLIC_REGISTRATION_ENABLED=false` oculta registro
- [ ] `last_seen` no escribe en cada request (< 5 min)
- [ ] `admin_audit_log` registra cambios de role/estado/vencimiento
- [ ] `/app/profile` edita nombre y WhatsApp

---

*Sprint 3 cerrado — próximo: Sprint 4 Regulatory Content Management.*
