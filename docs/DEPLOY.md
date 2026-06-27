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

| Variable | Production | Preview | Development |
|----------|------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` | auto | `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY` | opcional | opcional | opcional |

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
