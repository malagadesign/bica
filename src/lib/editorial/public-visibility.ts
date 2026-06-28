/** Criterio de visibilidad en exploración pública (usuarios autenticados). */
export const PUBLIC_EDITORIAL_STATUS = "published" as const;

export function isPubliclyVisibleIngredient(row: {
  is_active?: boolean | null;
  editorial_status?: string | null;
}): boolean {
  return row.is_active !== false && row.editorial_status === PUBLIC_EDITORIAL_STATUS;
}

export function isPubliclyVisibleRule(row: {
  is_active?: boolean | null;
  editorial_status?: string | null;
}): boolean {
  return row.is_active !== false && row.editorial_status === PUBLIC_EDITORIAL_STATUS;
}
