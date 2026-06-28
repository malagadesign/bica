# Deploy — Cosing AR (Vercel)

## 1. Repositorio

Subir `cosing-ar-next` a GitHub (o conectar directorio local).

## 2. Proyecto Vercel

1. [vercel.com/new](https://vercel.com/new)
2. Importar repositorio
3. **Framework Preset:** Next.js (detectado automáticamente)
4. **Root Directory:** `cosing-ar-next` (si el repo incluye monorepo con legacy Laravel)

## 3. Variables de entorno

En Vercel → Project → Settings → Environment Variables:

| Variable | Production | Preview | Development | Notas |
|----------|------------|---------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Obligatoria |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ | Proyectos nuevos (sb_publishable_...) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | alt. | alt. | alt. | Legacy JWT — una de las dos keys anteriores |
| `NEXT_PUBLIC_APP_URL` | ✅ | preview URL | `http://localhost:3000` | URL pública de la app (Auth callbacks) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Solo servidor — admin, publicar normativas |
| `PUBLIC_REGISTRATION_ENABLED` | opcional | opcional | opcional | `true` / `false` (default: `true`) |

**Nunca** agregar `SUPABASE_SERVICE_ROLE_KEY` a variables `NEXT_PUBLIC_*`.

## 4. Supabase Auth (producción)

Supabase Dashboard → Authentication → URL Configuration:

| Campo | Valor |
|-------|-------|
| Site URL | `https://tu-dominio.vercel.app` |
| Redirect URLs | `https://tu-dominio.vercel.app/auth/callback` |

Agregar también URLs de preview si se usan:

```
https://*.vercel.app/auth/callback
```

## 5. Migración de base de datos

Aplicar `supabase/migrations/20250626100000_initial_schema.sql` en el proyecto Supabase de producción (SQL Editor o CLI) **antes** del primer deploy con usuarios reales.

## 6. Deploy

```bash
# CLI opcional
npx vercel
npx vercel --prod
```

O push a branch main con integración Git conectada.

## 7. Verificar post-deploy

- [ ] Landing pública carga
- [ ] `/login` y `/register` accesibles
- [ ] `/app/dashboard` redirige a login sin sesión
- [ ] Registro + login funcional
- [ ] Logout funcional
- [ ] Build sin errores en Vercel dashboard

## 8. Dominio custom (opcional)

Vercel → Project → Settings → Domains → agregar dominio.

Actualizar `NEXT_PUBLIC_APP_URL` y Supabase Auth URLs con el dominio final.
