import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  getRecentAuditLogs,
  listUsersQuery,
  type AdminAuditEntry,
} from "@/modules/admin/users";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UsersPanel } from "@/components/admin/users-panel";

export const dynamic = "force-dynamic";

function groupAuditByUser(
  entries: AdminAuditEntry[]
): Record<string, AdminAuditEntry[]> {
  const grouped: Record<string, AdminAuditEntry[]> = {};
  for (const entry of entries) {
    const list = grouped[entry.target_user_id] ?? [];
    if (list.length < 5) list.push(entry);
    grouped[entry.target_user_id] = list;
  }
  return grouped;
}

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") {
    redirect("/app/dashboard");
  }

  const [users, auditLogs] = await Promise.all([
    listUsersQuery(supabase),
    getRecentAuditLogs(supabase),
  ]);

  return (
    <>
      <AppHeader title="Usuarios" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración" },
                { label: "Usuarios" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Gestioná el acceso manual: activá cuentas, suspendé usuarios y
              definí vencimientos. Los pagos se gestionan por fuera de la
              plataforma.
            </p>
          </div>

          <UsersPanel
            users={users}
            auditByUserId={groupAuditByUser(auditLogs)}
          />
        </div>
      </main>
    </>
  );
}
