"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth/profile";
import { detectSourceType } from "../parser/parse-file";
import { processRegulatoryUpdateFile } from "../process-update";
import { publishRegulatoryUpdate } from "../publish/publish-update";
import { getRegulatoryUpdateItems } from "../queries/get-update-items";
import { getRegulatoryUpdate } from "../queries/list-updates";
import {
  countConflicts,
  isReadyToPublish,
} from "../diff/compute-diff";
import { applyItemEdits } from "../edit/apply-item-edits";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import {
  buildNormativeTitle,
  getRegulatorySourceLabel,
} from "@/lib/regulatory/domain-catalog";
import type {
  BicaNormalizedRule,
  RegulatoryDomainContext,
  RegulatoryUpdateActionState,
} from "../types";

export async function uploadRegulatoryUpdate(
  _prev: RegulatoryUpdateActionState,
  formData: FormData
): Promise<RegulatoryUpdateActionState> {
  try {
    const { user } = await requireAdminProfile();
    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const regulatorySourceId = String(
      formData.get("regulatory_source_id") ?? ""
    ).trim();
    const documentTypeId = String(formData.get("document_type_id") ?? "").trim();
    const documentNumber = String(formData.get("document_number") ?? "").trim();
    const normativePublishedDate =
      String(formData.get("normative_published_date") ?? "").trim() || null;
    const officialUrl = String(formData.get("official_url") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const file = formData.get("file");

    const name = buildNormativeTitle({
      title,
      document_type_id: documentTypeId,
      document_number: documentNumber,
    });

    if (!name) {
      return {
        error: "Indicá el título o el tipo y número de la normativa.",
        success: null,
      };
    }

    if (!regulatorySourceId || !documentTypeId) {
      return { error: "Seleccioná fuente y tipo documental.", success: null };
    }

    if (!(file instanceof File) || file.size === 0) {
      return {
        error: "Adjuntá el documento fuente (Excel, CSV o PDF).",
        success: null,
      };
    }

    const sourceType = detectSourceType(file.name);
    if (!sourceType) {
      return {
        error: "Formato no soportado para análisis. Use Excel, CSV o PDF.",
        success: null,
      };
    }

    if (sourceType === "pdf") {
      return {
        error:
          "PDF registrado como documento fuente. El análisis asistido de PDF estará disponible próximamente.",
        success: null,
      };
    }

    const domainContext: RegulatoryDomainContext = {
      regulatory_source_id: regulatorySourceId,
      document_type_id: documentTypeId,
      document_number: documentNumber || null,
      official_url: officialUrl,
      normative_published_date: normativePublishedDate,
    };

    const origin = getRegulatorySourceLabel(regulatorySourceId);

    const { data: update, error: insertError } = await supabase
      .from("regulatory_updates")
      .insert({
        name,
        origin,
        notes,
        domain_context: domainContext,
        source_type: sourceType,
        source_filename: file.name,
        created_by: user.id,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const buffer = Buffer.from(await file.arrayBuffer());
    await processRegulatoryUpdateFile(supabase, update.id, buffer, file.name);

    revalidatePath("/app/admin/regulatory-updates");
    revalidatePath(`/app/admin/regulatory-updates/${update.id}`);

    return {
      error: null,
      success:
        "Normativa incorporada y analizada. Revisá la propuesta, corregí lo necesario y confirmá antes de publicar.",
      updateId: update.id,
    };
  } catch (err) {
    return {
      error: getErrorMessage(err, "No se pudo incorporar la normativa."),
      success: null,
    };
  }
}

export async function resolveRegulatoryConflict(
  _prev: RegulatoryUpdateActionState,
  formData: FormData
): Promise<RegulatoryUpdateActionState> {
  try {
    await requireAdminProfile();
    const supabase = await createClient();

    const itemId = String(formData.get("itemId") ?? "");
    const updateId = String(formData.get("updateId") ?? "");
    const resolution = String(formData.get("resolution") ?? "") as
      | "keep_published"
      | "accept_update";

    if (!itemId || !updateId || !resolution) {
      return { error: "Datos incompletos.", success: null };
    }

    const { error } = await supabase
      .from("regulatory_update_items")
      .update({ resolution })
      .eq("id", itemId)
      .eq("update_id", updateId);

    if (error) throw error;

    const items = await getRegulatoryUpdateItems(supabase, updateId, {
      conflictsOnly: false,
    });
    const conflictCount = countConflicts(items);

    await supabase
      .from("regulatory_updates")
      .update({ conflict_count: conflictCount, status: "in_review" })
      .eq("id", updateId);

    revalidatePath(`/app/admin/regulatory-updates/${updateId}`);

    return { error: null, success: "Conflicto resuelto.", updateId };
  } catch (err) {
    return {
      error: getErrorMessage(err, "No se pudo resolver el conflicto."),
      success: null,
    };
  }
}

export async function editRegulatoryUpdateItem(
  _prev: RegulatoryUpdateActionState,
  formData: FormData
): Promise<RegulatoryUpdateActionState> {
  try {
    await requireAdminProfile();
    const supabase = await createClient();

    const itemId = String(formData.get("itemId") ?? "");
    const updateId = String(formData.get("updateId") ?? "");

    if (!itemId || !updateId) {
      return { error: "Datos incompletos.", success: null };
    }

    const { data: item, error: fetchError } = await supabase
      .from("regulatory_update_items")
      .select("normalized_payload, update_id")
      .eq("id", itemId)
      .eq("update_id", updateId)
      .single();

    if (fetchError || !item) {
      return { error: "Ítem no encontrado.", success: null };
    }

    const payload = item.normalized_payload as BicaNormalizedRule;
    const updated = applyItemEdits(payload, {
      chemical_name: String(formData.get("chemical_name") ?? ""),
      inci_name: String(formData.get("inci_name") ?? ""),
      cas_number: String(formData.get("cas_number") ?? ""),
      max_concentration: String(formData.get("max_concentration") ?? ""),
      unit: String(formData.get("unit") ?? ""),
      limitation_text: String(formData.get("limitation_text") ?? ""),
      warning_text: String(formData.get("warning_text") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      review_reason: String(formData.get("review_reason") ?? ""),
    });

    const { error } = await supabase
      .from("regulatory_update_items")
      .update({ normalized_payload: updated })
      .eq("id", itemId)
      .eq("update_id", updateId);

    if (error) throw error;

    await supabase
      .from("regulatory_updates")
      .update({ status: "in_review" })
      .eq("id", updateId);

    revalidatePath(`/app/admin/regulatory-updates/${updateId}`);

    return {
      error: null,
      success: "Corrección guardada en la propuesta.",
      updateId,
    };
  } catch (err) {
    return {
      error: getErrorMessage(err, "No se pudo guardar la corrección."),
      success: null,
    };
  }
}

export async function confirmRegulatoryReview(
  _prev: RegulatoryUpdateActionState,
  formData: FormData
): Promise<RegulatoryUpdateActionState> {
  try {
    await requireAdminProfile();
    const supabase = await createClient();
    const updateId = String(formData.get("updateId") ?? "");

    if (!updateId) {
      return { error: "Actualización no encontrada.", success: null };
    }

    const update = await getRegulatoryUpdate(supabase, updateId);
    if (!update) {
      return { error: "Actualización no encontrada.", success: null };
    }

    if (update.status === "published") {
      return { error: "Esta actualización ya fue publicada.", success: null };
    }

    const items = await getRegulatoryUpdateItems(supabase, updateId);
    if (!isReadyToPublish(items)) {
      return {
        error: "Resolvé todos los conflictos antes de confirmar la revisión.",
        success: null,
      };
    }

    const { error } = await supabase
      .from("regulatory_updates")
      .update({
        status: "ready_to_publish",
        domain_context: {
          ...update.domain_context,
          review_confirmed_at: new Date().toISOString(),
        },
      })
      .eq("id", updateId);

    if (error) throw error;

    revalidatePath(`/app/admin/regulatory-updates/${updateId}`);
    revalidatePath("/app/admin/regulatory-updates");

    return {
      error: null,
      success: "Revisión confirmada. Ya podés publicar la actualización.",
      updateId,
    };
  } catch (err) {
    return {
      error: getErrorMessage(err, "No se pudo confirmar la revisión."),
      success: null,
    };
  }
}

export async function publishRegulatoryUpdateAction(
  _prev: RegulatoryUpdateActionState,
  formData: FormData
): Promise<RegulatoryUpdateActionState> {
  try {
    const { user } = await requireAdminProfile();
    const supabase = await createClient();
    const updateId = String(formData.get("updateId") ?? "");

    if (!updateId) {
      return { error: "Actualización no encontrada.", success: null };
    }

    const update = await getRegulatoryUpdate(supabase, updateId);
    if (!update) {
      return { error: "Actualización no encontrada.", success: null };
    }

    if (update.status === "published") {
      return { error: "Esta actualización ya fue publicada.", success: null };
    }

    if (update.status !== "ready_to_publish") {
      return {
        error:
          "Confirmá la revisión manual antes de publicar. La fuente oficial nunca se publica automáticamente.",
        success: null,
      };
    }

    const items = await getRegulatoryUpdateItems(supabase, updateId);
    if (!isReadyToPublish(items)) {
      return {
        error: "Resolvé todos los conflictos antes de publicar.",
        success: null,
      };
    }

    const version = await publishRegulatoryUpdate(
      updateId,
      items,
      update.diff_summary,
      user.id
    );

    revalidatePath("/app/admin/regulatory-updates");
    revalidatePath(`/app/admin/regulatory-updates/${updateId}`);
    revalidatePath("/app/admin/workspace");

    return {
      error: null,
      success: `Actualización normativa publicada — versión ${version}.`,
      updateId,
    };
  } catch (err) {
    return {
      error: getErrorMessage(err, "Error al publicar."),
      success: null,
    };
  }
}
