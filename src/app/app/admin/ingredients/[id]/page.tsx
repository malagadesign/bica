import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { getIngredientKnowledgeProfile } from "@/lib/data/ingredient-knowledge";
import {
  getContentRevisions,
  getIngredientEditorData,
  transitionIngredientStatus,
  archiveIngredient,
  restoreIngredient,
} from "@/modules/editorial";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialTabNav } from "@/components/editorial/tab-nav";
import { IngredientWorkflowActions } from "@/components/editorial/ingredient-workflow-actions";
import { IngredientGeneralForm } from "@/components/editorial/ingredient-general-form";
import { RegulatoryTimeline } from "@/components/knowledge/regulatory-timeline";
import { IngredientKnowledgeHeader } from "@/components/knowledge/ingredient-knowledge-header";
import { FeaturedDocuments } from "@/components/knowledge/featured-documents";
import { RuleStatusBadge } from "@/components/regulatory/status-badges";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import type { ContentRevision } from "@/modules/editorial/types";
import type { TimelineEvent } from "@/lib/data/ingredient-knowledge";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function buildEditorialTimeline(revisions: ContentRevision[]): TimelineEvent[] {
  return revisions.map((rev) => ({
    id: rev.id,
    date: rev.created_at,
    year: new Date(rev.created_at).getFullYear(),
    title: rev.change_summary ?? "Cambio editorial",
    description: null,
    kind: rev.editorial_status === "published" ? "publication" : "update",
  }));
}

export default async function AdminIngredientEditorPage({
  params,
  searchParams,
}: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "general";

  const [ingredient, profile, revisions] = await Promise.all([
    getIngredientEditorData(supabase, id),
    getIngredientKnowledgeProfile(supabase, id),
    getContentRevisions(supabase, "ingredient", id),
  ]);

  if (!ingredient || !profile) notFound();

  const basePath = `/app/admin/ingredients/${id}`;
  const uniqueDocuments = [
    ...new Map(
      profile.documents.map((d) => [d.id, d])
    ).values(),
  ];

  const restrictionCount = profile.restrictionCount;

  const tabs = [
    { id: "general", label: "General" },
    { id: "synonyms", label: "Sinónimos", count: profile.synonyms.length },
    { id: "rules", label: "Reglas regulatorias", count: profile.rules.length },
    { id: "restrictions", label: "Restricciones", count: restrictionCount },
    { id: "documents", label: "Documentos normativos", count: uniqueDocuments.length },
    { id: "history", label: "Historial", count: revisions.length },
  ];

  const editorialTimeline = buildEditorialTimeline(revisions);
  const timelineEvents =
    editorialTimeline.length > 0 ? editorialTimeline : profile.timeline;

  return (
    <>
      <AppHeader title={profile.displayName} userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="space-y-6">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Fichas regulatorias", href: "/app/admin/ingredients" },
                { label: profile.displayName },
              ]}
            />
            <IngredientKnowledgeHeader
              profile={profile}
              variant="admin"
              subtitle="Ficha regulatoria — edición editorial"
            />
          </div>

          <IngredientWorkflowActions
            ingredientId={id}
            status={ingredient.editorial_status}
            isActive={ingredient.is_active}
            onTransition={transitionIngredientStatus}
            onArchive={archiveIngredient}
            onRestore={restoreIngredient}
          />

          <Suspense fallback={null}>
            <EditorialTabNav tabs={tabs} basePath={basePath} />
          </Suspense>

          <div className="rounded-xl border bg-card p-6">
            {tab === "general" && (
              <IngredientGeneralForm ingredient={ingredient} />
            )}

            {tab === "synonyms" && (
              <ul className="space-y-2">
                {ingredient.synonyms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin sinónimos cargados.
                  </p>
                ) : (
                  ingredient.synonyms.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{s.synonym}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.synonym_type}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            )}

            {tab === "rules" && (
              <ul className="space-y-2">
                {ingredient.rules.map((rule) => (
                  <li key={rule.id}>
                    <Link
                      href={`/app/admin/rules/${rule.id}`}
                      className="flex flex-col gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{rule.listName}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.documentTitle}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <RuleStatusBadge status={rule.rule_status} />
                        <EditorialStatusBadge status={rule.editorial_status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {tab === "restrictions" && (
              <p className="text-sm text-muted-foreground">
                Las restricciones se editan desde cada regla regulatoria. Abrí
                una regla en la pestaña Reglas regulatorias.
              </p>
            )}

            {tab === "documents" && (
              <FeaturedDocuments documents={uniqueDocuments} showEmpty />
            )}

            {tab === "history" && (
              <RegulatoryTimeline events={timelineEvents} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
