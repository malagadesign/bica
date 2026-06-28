import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import {
  getRegulatoryUpdate,
  getRegulatoryUpdateItems,
} from "@/modules/regulatory-updates";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegulatoryUpdateDetail } from "@/components/regulatory-updates/update-detail";
import { ContextualKnowledgeLink } from "@/components/knowledge-center/contextual-knowledge-link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RegulatoryUpdateDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const update = await getRegulatoryUpdate(supabase, id);
  if (!update) notFound();

  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", update.created_by)
    .maybeSingle();

  const authorLabel =
    authorProfile?.full_name?.trim() ||
    authorProfile?.email ||
    null;

  const [items, conflictItems] = await Promise.all([
    getRegulatoryUpdateItems(supabase, id),
    getRegulatoryUpdateItems(supabase, id, { conflictsOnly: true }),
  ]);

  return (
    <>
      <AppHeader title={update.name} userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="flex items-start justify-between gap-4">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                {
                  label: "Actualizaciones normativas",
                  href: "/app/admin/regulatory-updates",
                },
                { label: update.name },
              ]}
            />
            <ContextualKnowledgeLink
              href="/app/help/admin/workflow-editorial-publicacion"
              label="Workflow editorial"
              description="Revisión, confirmación y publicación"
            />
          </div>
          <RegulatoryUpdateDetail
            update={update}
            items={items}
            conflictItems={conflictItems}
            authorLabel={authorLabel}
          />
        </div>
      </main>
    </>
  );
}
