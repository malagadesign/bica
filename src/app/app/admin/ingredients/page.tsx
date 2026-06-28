import Link from "next/link";
import { redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { listAdminIngredients } from "@/modules/editorial";
import type { EditorialStatus } from "@/modules/editorial/types";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { NeedsReviewBadge } from "@/components/regulatory/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLastUpdated } from "@/lib/format-date";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; q?: string; archived?: string }>;
};

export default async function AdminIngredientsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const sp = await searchParams;
  const status = sp.status as EditorialStatus | undefined;
  const archivedOnly = sp.archived === "1";
  const items = await listAdminIngredients(supabase, {
    status,
    q: sp.q,
    archivedOnly,
  });

  return (
    <>
      <AppHeader title="Fichas regulatorias" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Fichas regulatorias" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Fichas regulatorias
            </h1>
            <p className="text-sm text-muted-foreground">
              Publicá y mantené la base normativa con flujo editorial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { label: "Activas", href: "/app/admin/ingredients" },
              { label: "Borradores", href: "/app/admin/ingredients?status=draft" },
              {
                label: "En revisión",
                href: "/app/admin/ingredients?status=ready_for_review",
              },
              {
                label: "Publicadas",
                href: "/app/admin/ingredients?status=published",
              },
              {
                label: "Retiradas",
                href: "/app/admin/ingredients?archived=1",
              },
            ].map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="rounded-lg border px-3 py-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                {f.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No hay fichas en este filtro"
                description={
                  archivedOnly
                    ? "No hay fichas retiradas de consulta pública."
                    : status
                      ? "No hay ingredientes con este estado editorial. Probá otro filtro."
                      : "Todavía no hay ingredientes activos en el panel editorial."
                }
                action={
                  status || archivedOnly ? (
                    <Link
                      href="/app/admin/ingredients"
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Ver fichas activas
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              items.map((item) => (
              <Link
                key={item.id}
                href={`/app/admin/ingredients/${item.id}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-border hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium group-hover:underline">
                    {item.displayName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.ruleCount}{" "}
                    {item.ruleCount === 1
                      ? "regla regulatoria"
                      : "reglas regulatorias"}{" "}
                    · actualizado {formatLastUpdated(item.updated_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditorialStatusBadge status={item.editorial_status} />
                  {!item.is_active && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Retirada
                    </span>
                  )}
                  {item.needsReview && <NeedsReviewBadge />}
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
