import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "../types";
import { fetchUserEmails } from "./fetch-user-emails";

export async function listUsersQuery(
  supabase?: SupabaseClient
): Promise<AdminUserRow[]> {
  const client = supabase ?? (await createClient());

  const [{ data: profiles, error: profilesError }, emailById] =
    await Promise.all([
      client
        .from("profiles")
        .select(
          `
          id, full_name, whatsapp, avatar_url, role, access_status,
          access_expires_at, last_seen_at, last_login_at, notes,
          created_at, updated_at
        `
        )
        .order("last_seen_at", { ascending: false, nullsFirst: false }),
      fetchUserEmails(),
    ]);

  if (profilesError) throw profilesError;

  return ((profiles ?? []) as UserProfile[]).map((profile) => ({
    ...profile,
    email: emailById.get(profile.id) ?? "—",
  }));
}

export async function getTargetProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, full_name, whatsapp, avatar_url, role, access_status,
      access_expires_at, last_seen_at, last_login_at, notes,
      created_at, updated_at
    `
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}
