/** Escapa caracteres especiales de ILIKE/LIKE en PostgreSQL. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
