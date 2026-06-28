import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRegulatoryDocumentsWithStats } from "@/lib/data/regulatory-documents";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { DocumentCard } from "@/components/regulatory/document-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const documents = await getRegulatoryDocumentsWithStats(supabase);

  return (
    <>
      <AppHeader title="Documentos" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Documentos normativos" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Documentos normativos
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Resoluciones, disposiciones y referencias MERCOSUR que respaldan
              cada listado regulatorio.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((doc, index) => (
              <DocumentCard key={doc.id} document={doc} index={index} />
            ))}
          </div>

          {documents.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No existen documentos normativos cargados"
              description="Las resoluciones y disposiciones oficiales aparecerán acá cuando estén disponibles en la base."
            />
          )}
        </div>
      </main>
    </>
  );
}
