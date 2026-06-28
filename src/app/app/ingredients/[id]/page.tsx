import Link from "next/link";
import { ChevronRight, Scale } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIngredientKnowledgeProfile } from "@/lib/data/ingredient-knowledge";
import { getRegulatoryListBySlug } from "@/lib/data/regulatory-lists";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegulatorySnapshot } from "@/components/knowledge/regulatory-snapshot";
import { IngredientKnowledgeHeader } from "@/components/knowledge/ingredient-knowledge-header";
import { FeaturedDocuments } from "@/components/knowledge/featured-documents";
import { RegulatoryTimeline } from "@/components/knowledge/regulatory-timeline";
import { CrossReferences } from "@/components/knowledge/cross-references";
import {
  NeedsReviewBadge,
  RuleStatusBadge,
} from "@/components/regulatory/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { ContextualKnowledgeLink } from "@/components/knowledge-center/contextual-knowledge-link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function IngredientKnowledgePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const fromListSlug = sp.from;

  const profile = await getIngredientKnowledgeProfile(supabase, id, {
    publicOnly: true,
  });
  if (!profile) notFound();

  const fromList = fromListSlug
    ? await getRegulatoryListBySlug(supabase, fromListSlug)
    : null;

  const breadcrumbItems = fromList
    ? [
        { label: "Inicio", href: "/app/dashboard" },
        { label: "Listados", href: "/app/lists" },
        { label: fromList.name, href: `/app/lists/${fromListSlug}` },
        { label: profile.displayName },
      ]
    : [
        { label: "Inicio", href: "/app/dashboard" },
        { label: "Ingredientes regulados", href: "/app/ingredients" },
        { label: profile.displayName },
      ];

  return (
    <>
      <AppHeader title={profile.displayName} userEmail={user.email} />
      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-12">
          <div className="animate-fade-in-up space-y-8">
            <div className="flex items-start justify-between gap-4">
              <Breadcrumbs items={breadcrumbItems} />
              <ContextualKnowledgeLink
                href="/app/help/interpretar-ficha-regulatoria"
                label="Interpretar una ficha"
                description="Guía sobre snapshot, reglas y restricciones"
              />
            </div>
            <IngredientKnowledgeHeader profile={profile} />
          </div>

          <RegulatorySnapshot profile={profile} className="animate-fade-in-up" />

          <FeaturedDocuments
            documents={profile.documents}
            className="animate-fade-in-up"
          />

          <section className="animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Reglas regulatorias
              </h2>
              <span className="text-sm text-muted-foreground">
                {profile.ruleCount}{" "}
                {profile.ruleCount === 1 ? "regla" : "reglas"}
              </span>
            </div>

            {profile.rules.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="Sin reglas asociadas"
                description="Este ingrediente todavía no tiene reglas normativas cargadas."
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {profile.rules.map((rule, index) => (
                  <Link
                    key={rule.id}
                    href={`/app/rules/${rule.id}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                    className="animate-fade-in-up group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-accent/20 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium">{rule.listName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {rule.document?.document_number ?? rule.document?.title}
                        {rule.entry_number_ar
                          ? ` · Nº ${rule.entry_number_ar}`
                          : ""}
                      </p>
                      {rule.restrictionCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {rule.restrictionCount}{" "}
                          {rule.restrictionCount === 1
                            ? "restricción"
                            : "restricciones"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RuleStatusBadge status={rule.rule_status} />
                      {rule.needs_review && <NeedsReviewBadge />}
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {profile.synonyms.length > 0 && (
            <section className="animate-fade-in-up space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Sinónimos</h2>
              <div className="flex flex-wrap gap-2">
                {profile.synonyms.map((syn) => (
                  <span
                    key={`${syn.synonym}-${syn.synonym_type}`}
                    className="rounded-lg bg-muted/60 px-3 py-1.5 text-sm"
                  >
                    {syn.synonym}
                  </span>
                ))}
              </div>
            </section>
          )}

          <RegulatoryTimeline events={profile.timeline} />

          <CrossReferences profile={profile} />
        </div>
      </main>
    </>
  );
}
