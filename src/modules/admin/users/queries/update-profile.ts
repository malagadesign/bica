import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessStatus, UserRole } from "@/lib/auth/profile";
import type { AdminAuditAction } from "../types";
import { writeAdminAuditLog } from "./audit-log";
import { getTargetProfile } from "./list-users";

type ProfileUpdatePayload = {
  full_name?: string;
  whatsapp?: string | null;
  role?: UserRole;
  access_status?: AccessStatus;
  access_expires_at?: string | null;
  notes?: string | null;
};

const AUDIT_FIELD_MAP: Record<
  keyof Pick<
    ProfileUpdatePayload,
    "role" | "access_status" | "access_expires_at"
  >,
  AdminAuditAction
> = {
  role: "role_changed",
  access_status: "access_status_changed",
  access_expires_at: "access_expires_at_changed",
};

export async function updateProfileAsAdmin(
  supabase: SupabaseClient,
  adminId: string,
  userId: string,
  payload: ProfileUpdatePayload
): Promise<void> {
  const current = await getTargetProfile(supabase, userId);
  if (!current) throw new Error("Usuario no encontrado");

  for (const [field, action] of Object.entries(AUDIT_FIELD_MAP) as [
    keyof typeof AUDIT_FIELD_MAP,
    AdminAuditAction,
  ][]) {
    if (!(field in payload)) continue;

    const oldVal = current[field];
    const newVal = payload[field];

    if (oldVal !== newVal && (oldVal ?? null) !== (newVal ?? null)) {
      await writeAdminAuditLog(supabase, {
        adminId,
        targetUserId: userId,
        action,
        oldValue: { [field]: oldVal },
        newValue: { [field]: newVal ?? null },
      });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) throw error;
}
