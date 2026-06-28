import { cn } from "@/lib/utils";
import { badgeClass, editorialBadgeClasses } from "@/lib/brand/badges";
import {
  EDITORIAL_STATUS_LABELS,
  type EditorialStatus,
} from "@/modules/editorial/types";

export function EditorialStatusBadge({
  status,
  className,
}: {
  status: EditorialStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        badgeClass(editorialBadgeClasses(status)),
        className
      )}
    >
      {EDITORIAL_STATUS_LABELS[status]}
    </span>
  );
}
