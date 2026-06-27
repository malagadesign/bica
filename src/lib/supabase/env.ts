/**
 * Supabase acepta anon key (legacy JWT) o publishable key (sb_publishable_...).
 * Proyectos nuevos en Supabase suelen traer solo publishable key.
 */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local"
    );
  }

  return key;
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en .env.local");
  }

  return url;
}
