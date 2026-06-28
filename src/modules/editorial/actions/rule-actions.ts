"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { EditorialStatus } from "../types";
import { insertContentRevision } from "../queries/revisions";
import { getRuleEditorData } from "../queries/rule-editor";
import type { EditorialActionState } from "../types";

async function withAdmin<T>(
  fn: (adminId: string, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const { user } = await requireAdminProfile();
  return fn(user.id, await createClient());
}

export async function saveRuleDraft(
  _prev: EditorialActionState,
  formData: FormData
): Promise<EditorialActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Regla inválida", success: null };

    await withAdmin(async (adminId, supabase) => {
      const { error } = await supabase
        .from("ingredient_rules")
        .update({
          rule_status: formData.get("rule_status") as string,
          conditions_raw: ((formData.get("conditions_raw") as string) || "").trim() || null,
          editorial_status: "draft",
          editorial_updated_at: new Date().toISOString(),
          editorial_updated_by: adminId,
        })
        .eq("id", id);

      if (error) throw error;

      const snapshot = await getRuleEditorData(supabase, id);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "rule",
          entityId: id,
          editorialStatus: "draft",
          changeSummary: "Borrador de regla guardado",
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/rules/${id}`);
    return { error: null, success: "Borrador guardado." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
      success: null,
    };
  }
}

export async function transitionRuleStatus(
  ruleId: string,
  status: EditorialStatus,
  summary: string
): Promise<EditorialActionState> {
  try {
    await withAdmin(async (adminId, supabase) => {
      const payload: Record<string, unknown> = {
        editorial_status: status,
        editorial_updated_at: new Date().toISOString(),
        editorial_updated_by: adminId,
      };
      if (status === "published") {
        payload.published_at = new Date().toISOString();
        payload.published_by = adminId;
      }

      const { error } = await supabase
        .from("ingredient_rules")
        .update(payload)
        .eq("id", ruleId);

      if (error) throw error;

      const snapshot = await getRuleEditorData(supabase, ruleId);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "rule",
          entityId: ruleId,
          editorialStatus: status,
          changeSummary: summary,
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/rules/${ruleId}`);
    revalidatePath("/app/admin/workspace");
    return { error: null, success: summary };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error",
      success: null,
    };
  }
}
