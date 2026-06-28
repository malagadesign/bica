import { cn } from "@/lib/utils";
import { badgeClass } from "@/lib/brand/badges";
import type { AccessStatus, UserRole } from "@/lib/auth/profile";

const accessStyles: Record<AccessStatus, string> = {
  active:
    "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] ring-[var(--badge-success-ring)]",
  suspended:
    "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)] ring-[var(--badge-danger-ring)]",
  pending:
    "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] ring-[var(--badge-warning-ring)]",
};

const accessLabels: Record<AccessStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Pendiente",
};

const roleStyles: Record<UserRole, string> = {
  admin:
    "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)] ring-[var(--badge-info-ring)]",
  member:
    "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] ring-[var(--badge-muted-ring)]",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  member: "Miembro",
};

export function AccessStatusBadge({
  status,
  className,
}: {
  status: AccessStatus;
  className?: string;
}) {
  return (
    <span className={cn(badgeClass(accessStyles[status]), className)}>
      {accessLabels[status]}
    </span>
  );
}

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  return (
    <span className={cn(badgeClass(roleStyles[role]), className)}>
      {roleLabels[role]}
    </span>
  );
}

export function ExpiringSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        badgeClass(
          "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)] ring-[var(--badge-info-ring)]"
        ),
        className
      )}
    >
      Expira pronto
    </span>
  );
}
