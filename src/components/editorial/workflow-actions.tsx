"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EditorialStatus } from "@/modules/editorial/types";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { Button } from "@/components/ui/button";

type WorkflowActionsProps = {
  entityId: string;
  entityType: "ingredient" | "rule" | "document";
  status: EditorialStatus;
  onTransition: (
    id: string,
    status: EditorialStatus,
    summary: string
  ) => Promise<{ error: string | null; success: string | null }>;
};

const ENTITY_LABELS = {
  ingredient: "ficha regulatoria",
  rule: "regla regulatoria",
  document: "documento normativo",
};

export function WorkflowActions({
  entityId,
  entityType,
  status,
  onTransition,
}: WorkflowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const label = ENTITY_LABELS[entityType];

  function run(next: EditorialStatus, summary: string) {
    setError(null);
    startTransition(async () => {
      const result = await onTransition(entityId, next, summary);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Estado editorial</span>
        <EditorialStatusBadge status={status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {status !== "draft" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run("draft", `${label} revertida a borrador`)}
          >
            Volver a borrador
          </Button>
        )}
        {status !== "ready_for_review" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run("ready_for_review", `${label} enviada a revisión`)
            }
          >
            Enviar a revisión
          </Button>
        )}
        {status !== "published" && (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run("published", `${label} publicada`)}
          >
            Publicar normativa
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive sm:w-full">{error}</p>}
    </div>
  );
}
