# Setup local — Cosing AR

## 1. Clonar e instalar

```bash
cd cosing-ar-next
npm install
```

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completar en `.env.local` (o `.env`):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# Proyectos nuevos: publishable key (sb_publishable_...)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>

# Proyectos legacy: anon key JWT (eyJ...) — alternativa a la línea anterior
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Opcional en Etapa 0 — secret key (sb_secret_...) o service_role legacy
SUPABASE_SERVICE_ROLE_KEY=
```

Obtener keys en: Supabase Dashboard → **Project Settings** → **API**

> El código acepta `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 3. Crear proyecto Supabase

1. Ir a [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → nombre: `cosing-ar`
3. Guardar contraseña de base de datos
4. Copiar URL y anon key a `.env.local`

## 4. Aplicar migraciones

### Etapa 0 — schema inicial

1. Supabase Dashboard → **SQL Editor**
2. Ejecutar `supabase/migrations/20250626100000_initial_schema.sql`

### Etapa 1A — core rules (ingredient_rules, restrictions, etc.)

1. SQL Editor → ejecutar `supabase/migrations/20250627100000_etapa_1a_core_rules.sql`

### Supabase CLI (alternativa)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## 4b. Seed Etapa 1A (carga inicial controlada)

**No es el importador transaccional** — solo validación del modelo con CSV real.

1. Completar `SUPABASE_SERVICE_ROLE_KEY` en `.env` (Dashboard → API → Secret key)
2. CSV en `data/seeds/proyecto_listados_normalizado.csv`
3. Dry-run:

```bash
npm run seed:csv:dry-run
```

4. Seed real:

```bash
npm run seed:csv
```

El reporte se guarda en `data/seeds/seed-report-*.json`.

## 5. Configurar Auth

Supabase Dashboard → **Authentication** → **URL Configuration**:

| Campo | Valor local |
|-------|-------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

### Confirmación de email

- **Desarrollo:** Authentication → Providers → Email → desactivar "Confirm email" para login inmediato
- **Producción:** activar confirmación de email

## 6. Generar tipos TypeScript (opcional)

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
```

## 7. Ejecutar

```bash
npm run dev
```

### Verificar

- [ ] Landing en `/`
- [ ] Registro en `/register`
- [ ] Login en `/login`
- [ ] Dashboard protegido en `/app/dashboard`
- [ ] Logout funcional
- [ ] Redirect sin sesión → `/login`

## 8. Verificar build

```bash
npm run lint
npm run build
```

## Troubleshooting

**Error "Invalid API key"** — revisar `.env.local` y reiniciar `npm run dev`.

**Redirect loop** — verificar Site URL y Redirect URLs en Supabase Auth.

**Profile no creado al registrarse** — verificar que la migración incluye trigger `on_auth_user_created`.
