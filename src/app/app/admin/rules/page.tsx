import Link from "next/link";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { listAdminRules } from "@/modules/editorial";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { RuleStatusBadge, NeedsReviewBadge } from "@/components/regulatory/status-badges";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const rules = await listAdminRules(supabase);

  return (
    <>
      <AppHeader title="Reglas regulatorias" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Reglas regulatorias" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Reglas regulatorias
            </h1>
            <p className="text-sm text-muted-foreground">
              Reglas regulatorias por ingrediente, listado y documento.
            </p>
          </div>

          <div className="space-y-3">
            {rules.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="No hay reglas regulatorias cargadas"
                description="Las reglas vinculan ingredientes con listados y documentos normativos."
              />
            ) : (
              rules.map((rule) => (
              <Link
                key={rule.id}
                href={`/app/admin/rules/${rule.id}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium group-hover:underline">
                    {rule.ingredientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rule.listName} · {rule.documentTitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <RuleStatusBadge status={rule.rule_status} />
                  <EditorialStatusBadge status={rule.editorial_status} />
                  {rule.needs_review && <NeedsReviewBadge />}
                </div>
              </Link>
            ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
