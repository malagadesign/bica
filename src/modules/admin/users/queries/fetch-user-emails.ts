import { createAdminClient } from "@/lib/supabase/admin";

export async function fetchUserEmails(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  if (error) throw error;

  return new Map(
    (data.users ?? []).map((user) => [user.id, user.email ?? ""])
  );
}
