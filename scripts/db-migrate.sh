#!/usr/bin/env bash
# Aplica migraciones pendientes vía psql cuando `supabase link` no está configurado.
# Requiere DATABASE_URL en .env
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Error: falta .env con DATABASE_URL"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL no está definida en .env"
  exit 1
fi

MIGRATION="${1:-supabase/migrations/20250701100000_sprint_7_regulatory_updates.sql}"

if [ ! -f "$MIGRATION" ]; then
  echo "Error: no existe $MIGRATION"
  exit 1
fi

echo "Aplicando migración: $MIGRATION"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
echo "Listo."
