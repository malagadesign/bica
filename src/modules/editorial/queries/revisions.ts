import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentRevision, EditorialEntityType } from "../types";

export async function getContentRevisions(
  supabase: SupabaseClient,
  entityType: EditorialEntityType,
  entityId: string,
  limit = 20
): Promise<ContentRevision[]> {
  const { data, error } = await supabase
    .from("content_revisions")
    .select(
      "id, entity_type, entity_id, editorial_status, change_summary, snapshot, created_by, created_at"
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ContentRevision[];
}

export async function insertContentRevision(
  supabase: SupabaseClient,
  input: {
    entityType: EditorialEntityType;
    entityId: string;
    editorialStatus: string;
    changeSummary: string;
    snapshot: Record<string, unknown>;
    createdBy: string;
  }
): Promise<void> {
  const { error } = await supabase.from("content_revisions").insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    editorial_status: input.editorialStatus,
    change_summary: input.changeSummary,
    snapshot: input.snapshot,
    created_by: input.createdBy,
  });

  if (error) throw error;
}
