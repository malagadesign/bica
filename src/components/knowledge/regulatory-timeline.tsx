import { History } from "lucide-react";
import type { TimelineEvent } from "@/lib/data/ingredient-knowledge";
import { formatLastUpdated } from "@/lib/format-date";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type RegulatoryTimelineProps = {
  events: TimelineEvent[];
  className?: string;
};

export function RegulatoryTimeline({ events, className }: RegulatoryTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin eventos normativos registrados"
        description="Cuando se incorporen cambios regulatorios, la línea de tiempo mostrará la evolución del ingrediente."
        className={cn("py-10", className)}
      />
    );
  }

  const byYear = events.reduce<Map<number, TimelineEvent[]>>((acc, event) => {
    const yearEvents = acc.get(event.year) ?? [];
    yearEvents.push(event);
    acc.set(event.year, yearEvents);
    return acc;
  }, new Map());

  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary/60" />
        <h2 className="bica-section-title">Línea de tiempo normativa</h2>
      </div>

      <div className="bica-card p-6">
        <div className="relative space-y-10 pl-6">
          <div className="bica-timeline-line absolute bottom-2 left-[5px] top-2 w-px" />

          {years.map((year) => (
            <div key={year} className="space-y-5">
              <p className="relative text-sm font-semibold tabular-nums bica-timeline-year">
                <span className="bica-timeline-dot absolute -left-6 top-1.5 size-2.5 rounded-full ring-4 ring-card" />
                {year}
              </p>
              <ul className="space-y-5 border-l border-transparent pl-4">
                {(byYear.get(year) ?? []).map((event) => (
                  <li key={event.id} className="relative space-y-1 pl-2">
                    <p className="font-medium text-foreground">{event.title}</p>
                    {event.description && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatLastUpdated(event.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
