import type { IngredientKnowledgeProfile } from "@/lib/data/ingredient-knowledge";
import { EDITORIAL_STATUS_LABELS, type EditorialStatus } from "@/modules/editorial/types";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
} from "@/components/regulatory/status-badges";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { cn } from "@/lib/utils";

type IngredientKnowledgeHeaderProps = {
  profile: IngredientKnowledgeProfile;
  variant?: "public" | "admin";
  subtitle?: string;
  className?: string;
};

export function IngredientKnowledgeHeader({
  profile,
  variant = "public",
  subtitle,
  className,
}: IngredientKnowledgeHeaderProps) {
  const identifiers = [
    { label: "INCI", value: profile.inci_name, mono: false },
    { label: "CAS", value: profile.cas_number, mono: true },
    { label: "CI", value: profile.color_index, mono: true },
    { label: "EINECS", value: profile.einecs, mono: true },
  ].filter((f) => f.value);

  const editorialStatus = profile.editorial_status as EditorialStatus | null;

  return (
    <header className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="bica-kicker">Ficha regulatoria</p>
          <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            {profile.displayName}
          </h1>
          {profile.chemical_name &&
            profile.chemical_name !== profile.displayName && (
              <p className="text-lg text-muted-foreground">
                {profile.chemical_name}
              </p>
            )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.category && (
            <RegulatoryStatusBadge
              label={profile.category.label}
              tone={profile.category.tone}
            />
          )}
          {variant === "admin" && editorialStatus && (
            <EditorialStatusBadge status={editorialStatus} />
          )}
          {profile.needsReview && <NeedsReviewBadge />}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        {identifiers.map((field) => (
          <div key={field.label}>
            <span className="text-muted-foreground">{field.label}</span>{" "}
            <span
              className={cn(
                "font-medium",
                field.mono && "font-mono text-[0.9em]"
              )}
            >
              {field.value}
            </span>
          </div>
        ))}
        {profile.function && (
          <div>
            <span className="text-muted-foreground">Función</span>{" "}
            <span className="font-medium">{profile.function}</span>
          </div>
        )}
        {variant === "admin" && editorialStatus && (
          <div>
            <span className="text-muted-foreground">Estado editorial</span>{" "}
            <span className="font-medium">
              {EDITORIAL_STATUS_LABELS[editorialStatus]}
            </span>
          </div>
        )}
        {profile.published_at && (
          <div>
            <span className="text-muted-foreground">Versión</span>{" "}
            <span className="font-medium">
              {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
                new Date(profile.published_at)
              )}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
