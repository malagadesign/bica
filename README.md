# BICA — Base de Ingredientes Cosméticos Argentinos

Plataforma SaaS de **conocimiento regulatorio** para consulta y gestión de normativa cosmética **Argentina / MERCOSUR**.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind · shadcn/ui · Supabase · Vercel

**Contrato arquitectónico:** [`docs/ARCHITECTURE_FREEZE.md`](docs/ARCHITECTURE_FREEZE.md)

## Requisitos

- Node.js 20+
- npm
- Cuenta [Supabase](https://supabase.com)
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
| `npm run db:migrate:sprint7` | Migración actualizaciones normativas |
| `npm run db:migrate:sprint7a` | Migración contexto de dominio (Sprint 7A) |

## Centro de Conocimiento

Contenido orientado a usuarios y administradores (no documentación técnica):

| Ruta | Audiencia |
|------|-----------|
| [`/ayuda`](http://localhost:3000/ayuda) | Público — qué es BICA, aviso legal, FAQ |
| `/app/help` | Autenticado — guías de consulta regulatoria |
| `/app/help/admin` | Admin — actualizaciones normativas, workflow, usuarios |

Artículos en MDX: `content/help/`

## Documentación interna (equipo)

| Documento | Contenido |
|-----------|-----------|
| [`docs/SETUP.md`](docs/SETUP.md) | Configuración local + Supabase |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Deploy en Vercel |
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | Visión de producto |
| [`docs/REGULATORY_UPDATES.md`](docs/REGULATORY_UPDATES.md) | Pipeline actualizaciones normativas |
| [`docs/DOMAIN_LANGUAGE.md`](docs/DOMAIN_LANGUAGE.md) | Lenguaje de producto |
| [`docs/ARCHITECTURE_FREEZE.md`](docs/ARCHITECTURE_FREEZE.md) | Contrato arquitectónico |

## Estado actual

**Sprint 8** — Plataforma desplegada con:

- Consulta: búsqueda FTS, fichas regulatorias, listados, documentos, reglas
- Admin: workspace editorial, actualizaciones normativas, usuarios, auditoría
- Gobernanza: disclaimers, revisión humana obligatoria antes de publicar
- Centro de Conocimiento integrado (`/ayuda`, `/app/help`)

## Legacy

El proyecto Laravel anterior vive en `../cosing-ar/` — no se utiliza ni modifica.
