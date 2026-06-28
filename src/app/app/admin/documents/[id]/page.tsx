import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  getContentRevisions,
  getDocumentEditorData,
  transitionDocumentStatus,
} from "@/modules/editorial";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { WorkflowActions } from "@/components/editorial/workflow-actions";
import { DocumentEditorForm } from "@/components/editorial/document-editor-form";
import { RevisionHistory } from "@/components/editorial/revision-history";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { EditorialTabNav } from "@/components/editorial/tab-nav";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "edit", label: "Documento" },
  { id: "history", label: "Historial" },
];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminDocumentEditorPage({
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
  const tab = sp.tab ?? "edit";

  const [doc, revisions] = await Promise.all([
    getDocumentEditorData(supabase, id),
    getContentRevisions(supabase, "document", id),
  ]);

  if (!doc) notFound();

  const basePath = `/app/admin/documents/${id}`;

  return (
    <>
      <AppHeader title="Editor de documento" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Documentos", href: "/app/admin/documents" },
                { label: doc.title },
              ]}
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
              <EditorialStatusBadge status={doc.editorial_status} />
            </div>
          </div>

          <WorkflowActions
            entityId={id}
            entityType="document"
            status={doc.editorial_status}
            onTransition={transitionDocumentStatus}
          />

          <Suspense fallback={null}>
            <EditorialTabNav tabs={TABS} basePath={basePath} />
          </Suspense>

          <div className="rounded-xl border bg-card p-6">
            {tab === "edit" && <DocumentEditorForm doc={doc} />}
            {tab === "history" && <RevisionHistory revisions={revisions} />}
          </div>
        </div>
      </main>
    </>
  );
}
