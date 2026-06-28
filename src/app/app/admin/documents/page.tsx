import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { listAdminDocuments } from "@/modules/editorial";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const documents = await listAdminDocuments(supabase);

  return (
    <>
      <AppHeader title="Documentos normativos" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Documentos normativos" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Documentos normativos
            </h1>
            <p className="text-sm text-muted-foreground">
              Normas oficiales que respaldan listados y reglas.
            </p>
          </div>

          <div className="space-y-3">
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No hay documentos normativos en el panel"
                description="Los documentos oficiales aparecerán acá para su edición y publicación."
              />
            ) : (
              documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/app/admin/documents/${doc.id}`}
                className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium group-hover:underline">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.authorityName}
                    {doc.document_number && ` · ${doc.document_number}`} ·{" "}
                    {doc.ruleCount} reglas
                  </p>
                </div>
                <EditorialStatusBadge status={doc.editorial_status} />
              </Link>
            ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}
