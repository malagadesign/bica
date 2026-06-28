/** Convierte code de lista (FILTROS_UV) a slug URL (filtros-uv). */
export function listCodeToSlug(code: string): string {
  return code.toLowerCase().replace(/_/g, "-");
}

/** Convierte slug URL a code de lista (FILTROS_UV). */
export function slugToListCode(slug: string): string {
  return slug.trim().toUpperCase().replace(/-/g, "_");
}
