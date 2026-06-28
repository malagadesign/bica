import type { RegulatoryImpactMetrics } from "@/lib/regulatory/impact-metrics";

type RegulatoryImpactSummaryProps = {
  metrics: RegulatoryImpactMetrics;
  compact?: boolean;
};

export function RegulatoryImpactSummary({
  metrics,
  compact = false,
}: RegulatoryImpactSummaryProps) {
  const cards = [
    {
      label: "Ingredientes nuevos",
      value: metrics.ingredientsNew,
      tone: "text-[var(--badge-success-text)]",
    },
    {
      label: "Ingredientes modificados",
      value: metrics.ingredientsModified,
      tone: "text-[var(--badge-warning-text)]",
    },
    {
      label: "Ingredientes eliminados",
      value: metrics.ingredientsRemoved,
      tone: "text-muted-foreground",
    },
    {
      label: "Restricciones modificadas",
      value: metrics.restrictionsModified,
      tone: "text-[var(--badge-info-text)]",
    },
    {
      label: "Documentos relacionados",
      value: metrics.relatedDocuments,
      tone: "text-primary",
    },
    {
      label: "Necesitan revisión",
      value: metrics.needsReview,
      tone: "text-[var(--badge-warning-text)]",
    },
  ];

  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {cards.map((card) => (
        <div key={card.label} className="bica-card p-4">
          <p
            className={`${compact ? "text-xl" : "text-2xl"} font-semibold tabular-nums ${card.tone}`}
          >
            {card.value.toLocaleString("es-AR")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
