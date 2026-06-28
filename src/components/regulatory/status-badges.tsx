import { getRuleStatusConfig, statusToneClasses } from "@/lib/regulatory-status";
import { badgeClass } from "@/lib/brand/badges";
import { cn } from "@/lib/utils";

type RuleStatusBadgeProps = {
  status: string;
  className?: string;
};

export function RuleStatusBadge({ status, className }: RuleStatusBadgeProps) {
  const config = getRuleStatusConfig(status);

  return (
    <span
      className={cn(
        badgeClass(statusToneClasses(config.tone)),
        className
      )}
    >
      {config.label}
    </span>
  );
}

type RegulatoryStatusBadgeProps = {
  label: string;
  tone?: Parameters<typeof statusToneClasses>[0];
  className?: string;
};

export function RegulatoryStatusBadge({
  label,
  tone = "muted",
  className,
}: RegulatoryStatusBadgeProps) {
  return (
    <span
      className={cn(badgeClass(statusToneClasses(tone)), className)}
    >
      {label}
    </span>
  );
}

export function NeedsReviewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        badgeClass(statusToneClasses("warning")),
        className
      )}
    >
      Pendiente de revisión
    </span>
  );
}
