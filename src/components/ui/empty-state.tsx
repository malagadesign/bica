import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "animate-fade-in-up flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center",
        "border-[var(--bica-border)] bg-[color-mix(in_oklch,var(--bica-muted),transparent_40%)]",
        className
      )}
    >
      <div className="bica-empty-icon">
        <Icon className="size-6" strokeWidth={1.5} />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
