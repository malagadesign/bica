import Link from "next/link";
import { redirect } from "next/navigation";
import { GitBranch, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  listPublications,
  listRegulatoryUpdates,
} from "@/modules/regulatory-updates";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegulatoryUpdateListCard } from "@/components/regulatory-updates/update-list-card";
import { RegulatoryContextualHelp } from "@/components/regulatory-updates/contextual-help";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatLastUpdated } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RegulatoryUpdatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const [updates, publications] = await Promise.all([
    listRegulatoryUpdates(supabase),
    listPublications(supabase),
  ]);

  return (
    <>
      <AppHeader title="Actualizaciones normativas" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Breadcrumbs
                items={[
                  { label: "Inicio", href: "/app/dashboard" },
                  { label: "Administración", href: "/app/admin/workspace" },
                  { label: "Actualizaciones normativas" },
                ]}
              />
              <h1 className="text-2xl font-semibold tracking-tight text-primary">
                Actualizaciones normativas
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Gestión de activos regulatorios derivados de fuentes oficiales.
                Incorporá normativa, revisá la propuesta asistida y publicá con
                control humano.
              </p>
            </div>
            <Link
              href="/app/admin/regulatory-updates/new"
              className={cn(buttonVariants(), "gap-2")}
            >
              <Plus className="size-4" />
              Incorporar normativa
            </Link>
          </div>

          <RegulatoryContextualHelp />

          {updates.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="Sin actualizaciones normativas"
              description="Incorporá una nueva normativa oficial para iniciar el análisis asistido y la revisión manual."
              action={
                <Link
                  href="/app/admin/regulatory-updates/new"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Plus className="size-4" />
                  Incorporar normativa
                </Link>
              }
            />
          ) : (
            <div className="bica-card overflow-hidden">
              <ul className="divide-y divide-[var(--bica-border)]">
                {updates.map((update) => (
                  <li key={update.id}>
                    <RegulatoryUpdateListCard update={update} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {publications.length > 0 && (
            <section className="space-y-4">
              <h2 className="bica-section-title">Historial de publicaciones</h2>
              <div className="bica-card overflow-hidden">
                <ul className="divide-y divide-[var(--bica-border)]">
                  {publications.map((pub) => {
                    const update = updates.find((u) => u.id === pub.update_id);
                    return (
                      <li
                        key={pub.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            Versión {pub.version_number}
                            {update ? ` — ${update.name}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatLastUpdated(pub.published_at)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pub.change_summary.ingredients.new} ingredientes
                          nuevos · {pub.change_summary.ingredients.modified}{" "}
                          modificados
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
