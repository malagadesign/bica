import { badgeClass, badgeToneClasses } from "@/lib/brand/badges";
import {
  UPDATE_STATUS_LABELS,
  type RegulatoryUpdateStatus,
} from "@/modules/regulatory-updates/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<
  RegulatoryUpdateStatus,
  "muted" | "info" | "warning" | "success" | "danger"
> = {
  draft: "muted",
  processing: "info",
  validated: "info",
  in_review: "warning",
  ready_to_publish: "success",
  published: "success",
  failed: "danger",
};

type RegulatoryUpdateStatusBadgeProps = {
  status: RegulatoryUpdateStatus;
  className?: string;
};

export function RegulatoryUpdateStatusBadge({
  status,
  className,
}: RegulatoryUpdateStatusBadgeProps) {
  return (
    <span className={cn(badgeClass(badgeToneClasses(STATUS_TONE[status])), className)}>
      {UPDATE_STATUS_LABELS[status]}
    </span>
  );
}
