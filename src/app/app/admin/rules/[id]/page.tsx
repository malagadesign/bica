import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  getContentRevisions,
  getRuleEditorData,
  transitionRuleStatus,
} from "@/modules/editorial";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WorkflowActions } from "@/components/editorial/workflow-actions";
import { RuleEditorForm } from "@/components/editorial/rule-editor-form";
import { RevisionHistory } from "@/components/editorial/revision-history";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { EditorialTabNav } from "@/components/editorial/tab-nav";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "edit", label: "Regla" },
  { id: "history", label: "Historial" },
];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminRuleEditorPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab ?? "edit";

  const [rule, revisions] = await Promise.all([
    getRuleEditorData(supabase, id),
    getContentRevisions(supabase, "rule", id),
  ]);

  if (!rule) notFound();

  const basePath = `/app/admin/rules/${id}`;

  return (
    <>
      <AppHeader title="Editor de regla" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Reglas", href: "/app/admin/rules" },
                { label: rule.ingredientName },
              ]}
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {rule.ingredientName}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rule.listName} ·{" "}
                  <Link
                    href={`/app/admin/documents/${rule.documentId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {rule.documentTitle}
                  </Link>
                </p>
              </div>
              <EditorialStatusBadge status={rule.editorial_status} />
            </div>
          </div>

          <WorkflowActions
            entityId={id}
            entityType="rule"
            status={rule.editorial_status}
            onTransition={transitionRuleStatus}
          />

          <Suspense fallback={null}>
            <EditorialTabNav tabs={TABS} basePath={basePath} />
          </Suspense>

          <div className="rounded-xl border bg-card p-6">
            {tab === "edit" && <RuleEditorForm rule={rule} />}
            {tab === "history" && <RevisionHistory revisions={revisions} />}
          </div>
        </div>
      </main>
    </>
  );
}
