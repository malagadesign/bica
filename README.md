# Cosing AR

Plataforma SaaS regulatoria para consulta de ingredientes y normativas cosméticas.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel

**Contrato arquitectónico:** [`docs/ARCHITECTURE_FREEZE.md`](docs/ARCHITECTURE_FREEZE.md)

## Requisitos

- Node.js 20+
- npm
- Cuenta [Supabase](https://supabase.com) (proyecto `cosing-ar`)
- Cuenta [Vercel](https://vercel.com) (deploy)

## Inicio rápido

```bash
cp .env.example .env.local
# Completar variables Supabase en .env.local

npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`docs/SETUP.md`](docs/SETUP.md) | Configuración local + Supabase |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Deploy en Vercel |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Visión de producto |
| [`docs/ARCHITECTURE_FREEZE.md`](docs/ARCHITECTURE_FREEZE.md) | Contrato arquitectónico |

## Etapa actual

**Etapa 0** — Fundación: landing, auth, dashboard, schema SQL inicial.

## Legacy

El proyecto Laravel anterior vive en `../cosing-ar/` — no se utiliza ni modifica.
