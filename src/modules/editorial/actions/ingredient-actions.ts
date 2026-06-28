"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { EditorialStatus } from "../types";
import { insertContentRevision } from "../queries/revisions";
import { getIngredientEditorData } from "../queries/ingredient-editor";
import type { EditorialActionState } from "../types";

async function withAdminEditorial<T>(
  fn: (adminId: string, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const { user } = await requireAdminProfile();
  const supabase = await createClient();
  return fn(user.id, supabase);
}

export async function saveIngredientDraft(
  _prev: EditorialActionState,
  formData: FormData
): Promise<EditorialActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Ingrediente inválido", success: null };

    await withAdminEditorial(async (adminId, supabase) => {
      const payload = {
        inci_name: ((formData.get("inci_name") as string) || "").trim() || null,
        chemical_name: ((formData.get("chemical_name") as string) || "").trim() || null,
        cas_number: ((formData.get("cas_number") as string) || "").trim() || null,
        color_index: ((formData.get("color_index") as string) || "").trim() || null,
        einecs: ((formData.get("einecs") as string) || "").trim() || null,
        function: ((formData.get("function") as string) || "").trim() || null,
        notes: ((formData.get("notes") as string) || "").trim() || null,
        editorial_status: "draft" as EditorialStatus,
        editorial_updated_at: new Date().toISOString(),
        editorial_updated_by: adminId,
      };

      const { error } = await supabase
        .from("ingredients")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      const snapshot = await getIngredientEditorData(supabase, id);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "ingredient",
          entityId: id,
          editorialStatus: "draft",
          changeSummary: "Borrador guardado",
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/ingredients/${id}`);
    revalidatePath("/app/admin/ingredients");
    revalidatePath("/app/admin/workspace");
    return { error: null, success: "Borrador guardado." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
      success: null,
    };
  }
}

export async function transitionIngredientStatus(
  ingredientId: string,
  status: EditorialStatus,
  summary: string
): Promise<EditorialActionState> {
  try {
    await withAdminEditorial(async (adminId, supabase) => {
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
        .from("ingredients")
        .update(payload)
        .eq("id", ingredientId);

      if (error) throw error;

      const snapshot = await getIngredientEditorData(supabase, ingredientId);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "ingredient",
          entityId: ingredientId,
          editorialStatus: status,
          changeSummary: summary,
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/ingredients/${ingredientId}`);
    revalidatePath("/app/admin/workspace");
    return { error: null, success: summary };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error en transición",
      success: null,
    };
  }
}
