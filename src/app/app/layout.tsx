import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId, touchLastSeen } from "@/lib/auth/profile";
import { AppLayoutShell } from "@/components/layout/app-layout-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfileByUserId(supabase, user.id);
  if (profile) {
    await touchLastSeen(user.id, profile.last_seen_at);
  }

  return (
    <AppLayoutShell isAdmin={profile?.role === "admin"}>
      {children}
    </AppLayoutShell>
  );
}
