import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ChevronRight, FlaskConical, List, Scale } from "lucide-react";
import type { IngredientKnowledgeProfile } from "@/lib/data/ingredient-knowledge";
import { RegulatoryStatusBadge } from "@/components/regulatory/status-badges";
import { cn } from "@/lib/utils";

type CrossReferencesProps = {
  profile: IngredientKnowledgeProfile;
  className?: string;
};

export function CrossReferences({ profile, className }: CrossReferencesProps) {
  const hasLists = profile.lists.length > 0;
  const hasDocuments = profile.documents.length > 0;
  const hasRules = profile.rules.length > 0;
  const hasRelated = profile.relatedIngredients.length > 0;

  if (!hasLists && !hasDocuments && !hasRules && !hasRelated) return null;

  return (
    <section className={cn("space-y-8", className)}>
      <h2 className="text-lg font-semibold tracking-tight">
        Referencias cruzadas
      </h2>

      <div className="grid gap-8 md:grid-cols-2">
        {hasLists && (
          <CrossRefGroup
            icon={List}
            title="Listas regulatorias relacionadas"
            items={profile.lists.map((list) => ({
              href: `/app/lists/${list.slug}`,
              label: list.name,
            }))}
          />
        )}

        {hasDocuments && (
          <CrossRefGroup
            icon={Scale}
            title="Documentos normativos relacionados"
            items={profile.documents.map((doc) => ({
              href: `/app/documents/${doc.id}`,
              label: doc.document_number ?? doc.title,
            }))}
          />
        )}

        {hasRules && (
          <CrossRefGroup
            icon={Scale}
            title="Reglas regulatorias"
            items={profile.rules.map((rule) => ({
              href: `/app/rules/${rule.id}`,
              label: rule.listName,
              badge: rule.rule_status,
            }))}
          />
        )}

        {hasRelated && (
          <CrossRefGroup
            icon={FlaskConical}
            title="Ingredientes relacionados"
            items={profile.relatedIngredients.map((ing) => ({
              href: `/app/ingredients/${ing.id}`,
              label: ing.displayName,
              sublabel: ing.listName,
              statusLabel: ing.statusLabel,
              statusTone: ing.statusTone,
            }))}
          />
        )}
      </div>
    </section>
  );
}

type CrossRefItem = {
  href: string;
  label: string;
  sublabel?: string;
  statusLabel?: string | null;
  statusTone?: "danger" | "warning" | "success" | "info" | "muted" | null;
  badge?: string;
};

function CrossRefGroup({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: CrossRefItem[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" />
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium group-hover:underline">
                  {item.label}
                </p>
                {item.sublabel && (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.sublabel}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.statusLabel && item.statusTone && (
                  <RegulatoryStatusBadge
                    label={item.statusLabel}
                    tone={item.statusTone}
                  />
                )}
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
