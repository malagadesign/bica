import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getWorkspaceStats } from "@/modules/editorial";
import { getDemoIngredients } from "@/lib/data/demo-ingredients";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DemoIngredientsPanel } from "@/components/admin/demo-ingredients-panel";
import { DemoToursPanel } from "@/components/admin/demo-tours-panel";
import { formatLastUpdated } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export default async function AdminWorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const [stats, demoIngredients] = await Promise.all([
    getWorkspaceStats(supabase),
    getDemoIngredients(supabase, 8),
  ]);

  const cards = [
    {
      label: "Borradores",
      description: "Contenido en edición",
      value: stats.drafts,
      href: "/app/admin/ingredients?status=draft",
      tone: "text-muted-foreground",
    },
    {
      label: "Listos para revisión",
      description: "Pendientes de aprobación",
      value: stats.readyForReview,
      href: "/app/admin/ingredients?status=ready_for_review",
      tone: "text-[var(--badge-warning-text)]",
    },
    {
      label: "Publicados",
      description: "Normativa vigente",
      value: stats.published,
      href: "/app/admin/ingredients?status=published",
      tone: "text-[var(--badge-success-text)]",
    },
    {
      label: "Pendientes de revisión",
      description: "Reglas con alertas",
      value: stats.needsReview,
      href: "/app/admin/rules",
      tone: "text-[var(--badge-info-text)]",
    },
  ];

  return (
    <>
      <AppHeader title="Workspace editorial" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración" },
                { label: "Workspace editorial" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspace editorial
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Centro de publicación normativa. Borradores, revisiones y
              publicaciones en un solo lugar.
            </p>
          </div>

          <DemoIngredientsPanel ingredients={demoIngredients} />

          <DemoToursPanel />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bica-card-interactive p-5 hover:-translate-y-0.5"
              >
                <p className={`text-3xl font-semibold tabular-nums ${card.tone}`}>
                  {card.value.toLocaleString("es-AR")}
                </p>
                <p className="mt-1 text-sm font-medium">{card.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bica-card p-5">
              <p className="text-sm font-medium">Última publicación</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatLastUpdated(stats.lastPublication)}
              </p>
            </div>
            <div className="bica-card p-5">
              <p className="text-sm font-medium">Última actualización incorporada</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatLastUpdated(stats.lastImport)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/admin/regulatory-updates"
              className="rounded-lg border border-[var(--bica-border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bica-muted)]"
            >
              Actualizaciones normativas
            </Link>
            <Link
              href="/app/admin/ingredients"
              className="rounded-lg border border-[var(--bica-border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bica-muted)]"
            >
              Fichas regulatorias
            </Link>
            <Link
              href="/app/admin/rules"
              className="rounded-lg border border-[var(--bica-border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bica-muted)]"
            >
              Reglas regulatorias
            </Link>
            <Link
              href="/app/admin/documents"
              className="rounded-lg border border-[var(--bica-border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--bica-muted)]"
            >
              Documentos normativos
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
