import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRegulatoryListsWithStats } from "@/lib/data/regulatory-lists";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { RegulatoryListCard } from "@/components/regulatory/list-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const lists = await getRegulatoryListsWithStats(supabase);

  return (
    <>
      <AppHeader title="Listados" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Listados" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Listados regulatorios
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explorá la normativa Argentina / MERCOSUR por categoría: colorantes,
              conservantes, filtros solares, prohibidos y más.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list, index) => (
              <RegulatoryListCard key={list.id} list={list} index={index} />
            ))}
          </div>

          {lists.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="No hay listados regulatorios cargados"
              description="Cuando la base normativa esté disponible, vas a poder explorar colorantes, conservantes, filtros UV y más."
            />
          )}
        </div>
      </main>
    </>
  );
}
