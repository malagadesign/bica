"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { EditorialStatus } from "../types";
import { insertContentRevision } from "../queries/revisions";
import { getDocumentEditorData } from "../queries/document-editor";
import type { EditorialActionState } from "../types";

async function withAdmin<T>(
  fn: (adminId: string, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const { user } = await requireAdminProfile();
  return fn(user.id, await createClient());
}

export async function saveDocumentDraft(
  _prev: EditorialActionState,
  formData: FormData
): Promise<EditorialActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Documento inválido", success: null };

    await withAdmin(async (adminId, supabase) => {
      const { error } = await supabase
        .from("regulatory_documents")
        .update({
          title: ((formData.get("title") as string) || "").trim(),
          document_number:
            ((formData.get("document_number") as string) || "").trim() || null,
          summary: ((formData.get("summary") as string) || "").trim() || null,
          editorial_status: "draft",
          editorial_updated_at: new Date().toISOString(),
          editorial_updated_by: adminId,
        })
        .eq("id", id);

      if (error) throw error;

      const snapshot = await getDocumentEditorData(supabase, id);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "document",
          entityId: id,
          editorialStatus: "draft",
          changeSummary: "Borrador de documento guardado",
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/documents/${id}`);
    return { error: null, success: "Borrador guardado." };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al guardar",
      success: null,
    };
  }
}

export async function transitionDocumentStatus(
  documentId: string,
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
        .from("regulatory_documents")
        .update(payload)
        .eq("id", documentId);

      if (error) throw error;

      const snapshot = await getDocumentEditorData(supabase, documentId);
      if (snapshot) {
        await insertContentRevision(supabase, {
          entityType: "document",
          entityId: documentId,
          editorialStatus: status,
          changeSummary: summary,
          snapshot: snapshot as unknown as Record<string, unknown>,
          createdBy: adminId,
        });
      }
    });

    revalidatePath(`/app/admin/documents/${documentId}`);
    revalidatePath("/app/admin/workspace");
    return { error: null, success: summary };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error",
      success: null,
    };
  }
}
