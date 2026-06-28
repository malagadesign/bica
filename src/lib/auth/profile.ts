import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "member";
export type AccessStatus = "active" | "suspended" | "pending";

export type UserProfile = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRole;
  access_status: AccessStatus;
  access_expires_at: string | null;
  last_seen_at: string | null;
  last_login_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function isAccessAllowed(profile: Pick<
  UserProfile,
  "access_status" | "access_expires_at"
>): boolean {
  if (profile.access_status !== "active") return false;
  if (!profile.access_expires_at) return true;
  return new Date(profile.access_expires_at) > new Date();
}

export async function getProfileByUserId(
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

export async function getCurrentProfile(): Promise<{
  user: { id: string; email?: string };
  profile: UserProfile;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfileByUserId(supabase, user.id);
  if (!profile) return null;

  return { user: { id: user.id, email: user.email }, profile };
}

export async function requireAdminProfile(): Promise<{
  user: { id: string; email?: string };
  profile: UserProfile;
}> {
  const current = await getCurrentProfile();
  if (!current) {
    throw new Error("Unauthorized");
  }
  if (current.profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return current;
}

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export async function touchLastSeen(
  userId: string,
  lastSeenAt: string | null = null
): Promise<void> {
  if (lastSeenAt) {
    const elapsed = Date.now() - new Date(lastSeenAt).getTime();
    if (elapsed < LAST_SEEN_THROTTLE_MS) return;
  }

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function updateOwnProfile(
  userId: string,
  data: { full_name: string; whatsapp: string }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim(),
      whatsapp: data.whatsapp.trim(),
    })
    .eq("id", userId);

  if (error) throw error;
}
