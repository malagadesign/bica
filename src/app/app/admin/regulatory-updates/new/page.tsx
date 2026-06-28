import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegulatoryUpdateUploadForm } from "@/components/regulatory-updates/upload-form";

export const dynamic = "force-dynamic";

export default async function NewRegulatoryUpdatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  return (
    <>
      <AppHeader title="Incorporar normativa" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                {
                  label: "Actualizaciones normativas",
                  href: "/app/admin/regulatory-updates",
                },
                { label: "Incorporar normativa" },
              ]}
            />
          </div>
          <RegulatoryUpdateUploadForm />
        </div>
      </main>
    </>
  );
}
