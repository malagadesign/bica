import type { UpdateTimelineStep } from "@/lib/regulatory/update-timeline";
import { formatLastUpdated } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type RegulatoryUpdateTimelineProps = {
  steps: UpdateTimelineStep[];
};

export function RegulatoryUpdateTimeline({
  steps,
}: RegulatoryUpdateTimelineProps) {
  return (
    <section className="bica-card p-6">
      <h2 className="bica-section-title mb-5">Recorrido de la actualización</h2>
      <ol className="relative space-y-0 border-l border-[var(--bica-border)] pl-6">
        {steps.map((step, index) => (
          <li key={step.id} className="relative pb-6 last:pb-0">
            <span
              className={cn(
                "absolute -left-[calc(0.75rem+1px)] top-1 size-3 rounded-full border-2 bg-background",
                step.completed
                  ? "border-primary bg-primary"
                  : step.current
                    ? "border-primary"
                    : "border-[var(--bica-border)]"
              )}
            />
            <div className="space-y-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.completed || step.current
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {index + 1}. {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground">
                  {formatLastUpdated(step.timestamp)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
