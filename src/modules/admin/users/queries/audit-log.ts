import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminAuditAction, AdminAuditEntry } from "../types";

type WriteAuditInput = {
  adminId: string;
  targetUserId: string;
  action: AdminAuditAction;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
};

export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  input: WriteAuditInput
): Promise<void> {
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_id: input.adminId,
    target_user_id: input.targetUserId,
    action: input.action,
    old_value: input.oldValue,
    new_value: input.newValue,
  });

  if (error) throw error;
}

export async function getAuditLogForUser(
  supabase: SupabaseClient,
  targetUserId: string,
  limit = 10
): Promise<AdminAuditEntry[]> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_id, target_user_id, action, old_value, new_value, created_at")
    .eq("target_user_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as AdminAuditEntry[];
}

export async function getRecentAuditLogs(
  supabase: SupabaseClient,
  limit = 200
): Promise<AdminAuditEntry[]> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_id, target_user_id, action, old_value, new_value, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as AdminAuditEntry[];
}
