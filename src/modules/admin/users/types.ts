import type { AccessStatus, UserProfile, UserRole } from "@/lib/auth/profile";

export type { AccessStatus, UserRole, UserProfile };

export type AdminUserRow = UserProfile & {
  email: string;
};

export type AdminActionState = {
  error: string | null;
  success: string | null;
};

export const adminActionInitial: AdminActionState = {
  error: null,
  success: null,
};

export type AdminAuditEntry = {
  id: string;
  admin_id: string;
  target_user_id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
};

export type AdminAuditAction =
  | "role_changed"
  | "access_status_changed"
  | "access_expires_at_changed";

export type UserStats = {
  active: number;
  pending: number;
  suspended: number;
  expiringSoon: number;
};

export const EXPIRING_SOON_DAYS = 7;

export function isExpiringSoon(accessExpiresAt: string | null): boolean {
  if (!accessExpiresAt) return false;
  const expires = new Date(accessExpiresAt).getTime();
  const now = Date.now();
  const windowMs = EXPIRING_SOON_DAYS * 86_400_000;
  return expires > now && expires - now <= windowMs;
}

export function computeUserStats(users: AdminUserRow[]): UserStats {
  return users.reduce(
    (acc, user) => {
      if (user.access_status === "active") acc.active += 1;
      if (user.access_status === "pending") acc.pending += 1;
      if (user.access_status === "suspended") acc.suspended += 1;
      if (isExpiringSoon(user.access_expires_at)) acc.expiringSoon += 1;
      return acc;
    },
    { active: 0, pending: 0, suspended: 0, expiringSoon: 0 }
  );
}
