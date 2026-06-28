import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProfileForm } from "@/components/profile/profile-form";
import {
  AccessStatusBadge,
  RoleBadge,
} from "@/components/admin/access-badges";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const { profile } = current;

  return (
    <>
      <AppHeader title="Mi perfil" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-lg space-y-8">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Mi perfil" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
            <p className="text-sm text-muted-foreground">
              Actualizá tu nombre y WhatsApp de contacto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <AccessStatusBadge status={profile.access_status} />
            <RoleBadge role={profile.role} />
          </div>

          <div className="rounded-xl border bg-card p-6">
            <ProfileForm
              fullName={profile.full_name ?? ""}
              whatsapp={profile.whatsapp ?? ""}
              email={user.email ?? ""}
            />
          </div>
        </div>
      </main>
    </>
  );
}
