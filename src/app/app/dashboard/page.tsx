import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, FlaskConical, AlertCircle, Scale, Clock, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/data/dashboard-stats";
import { getRegulatoryListsWithStats } from "@/lib/data/regulatory-lists";
import { formatLastUpdated } from "@/lib/format-date";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { IngredientSearch } from "@/components/search/ingredient-search";
import { RegulatoryListCard } from "@/components/regulatory/list-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ContextualKnowledgeLink } from "@/components/knowledge-center/contextual-knowledge-link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [stats, lists] = await Promise.all([
    getDashboardStats(supabase),
    getRegulatoryListsWithStats(supabase),
  ]);

  const firstName = user.user_metadata?.full_name?.split(" ")[0];

  const statItems = [
    {
      label: "Ingredientes regulados",
      value: stats.ingredients,
      href: "/app/ingredients",
      icon: FlaskConical,
    },
    {
      label: "Reglas regulatorias",
      value: stats.rules,
      href: "/app/rules",
      icon: Scale,
    },
    {
      label: "Documentos normativos",
      value: stats.documents,
      href: "/app/documents",
      icon: FileText,
    },
    {
      label: "Pendientes de revisión",
      value: stats.needsReview,
      href: "/app/rules?needs_review=true",
      icon: AlertCircle,
      highlight: stats.needsReview > 0,
    },
  ];

  const featuredLists = lists
    .filter((l) => l.ruleCount > 0)
    .sort((a, b) => b.ingredientCount - a.ingredientCount)
    .slice(0, 6);

  return (
    <>
      <AppHeader title="Inicio" userEmail={user.email} />
      <main className="flex flex-1 flex-col">
        <section className="bica-dashboard-hero relative border-b px-6 py-14 md:py-20">
          <div className="absolute right-6 top-6">
            <ContextualKnowledgeLink
              href="/app/help/primeros-pasos"
              label="Primeros pasos"
              description="Orientación para tu primer recorrido en BICA"
            />
          </div>
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
            <div className="animate-fade-in-up w-full space-y-3">
              <Breadcrumbs
                items={[{ label: "Inicio" }]}
                className="justify-center"
              />
              <p className="bica-kicker">Plataforma BICA</p>
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                {firstName ? `Hola, ${firstName}` : "Consultá un ingrediente"}
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Encontrá al instante si un ingrediente está permitido, restringido
                o prohibido — o explorá la normativa por listado y documento.
              </p>
            </div>
            <IngredientSearch variant="hero" autoFocus className="max-w-2xl" />
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="animate-fade-in-up group bica-card-interactive p-5 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-4 text-primary/60 transition-colors group-hover:text-primary" />
                    <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      Abrir
                    </span>
                  </div>
                  <p
                    className={`mt-4 text-2xl font-semibold tabular-nums tracking-tight text-primary ${
                      item.highlight ? "text-[var(--badge-warning-text)]" : ""
                    }`}
                  >
                    {item.value.toLocaleString("es-AR")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </Link>
              );
            })}
          </div>

          <p className="animate-fade-in-up mx-auto mt-10 max-w-5xl text-center text-sm text-muted-foreground">
            Última actualización normativa:{" "}
            <span className="font-medium text-foreground">
              {formatLastUpdated(stats.lastUpdated)}
            </span>
          </p>
        </section>

        {stats.recentPublications.length > 0 && (
          <section className="border-t bg-muted/5 px-6 py-10">
            <div className="mx-auto w-full max-w-5xl space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Publicaciones recientes
                </h2>
              </div>
              <ul className="space-y-2">
                {stats.recentPublications.map((pub) => (
                  <li key={pub.id}>
                    <Link
                      href={`/app/ingredients/${pub.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--bica-border)] bg-card px-4 py-3 text-sm transition-colors hover:bg-[var(--bica-muted)]"
                    >
                      <span className="font-medium">{pub.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatLastUpdated(pub.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="border-t bg-muted/10 px-6 py-12">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Explorar listados regulatorios
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Argentina / MERCOSUR — navegá por categoría normativa
                </p>
              </div>
              <Link
                href="/app/lists"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver todos ({lists.length}) →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredLists.length > 0 ? (
                featuredLists.map((list, index) => (
                  <RegulatoryListCard
                    key={list.id}
                    list={list}
                    index={index}
                    compact
                  />
                ))
              ) : (
                <div className="sm:col-span-2 lg:col-span-3">
                  <EmptyState
                    icon={ClipboardList}
                    title="Listados regulatorios en preparación"
                    description="Cuando la base esté cargada, vas a ver acá las categorías normativas principales."
                    action={
                      <Link
                        href="/app/lists"
                        className="text-sm font-medium underline-offset-4 hover:underline"
                      >
                        Ver listados
                      </Link>
                    }
                    className="py-10"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
