"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { EditorialStatus } from "@/modules/editorial/types";
import { EditorialStatusBadge } from "@/components/editorial/status-badge";
import { Button } from "@/components/ui/button";

type IngredientWorkflowActionsProps = {
  ingredientId: string;
  status: EditorialStatus;
  isActive: boolean;
  onTransition: (
    id: string,
    status: EditorialStatus,
    summary: string
  ) => Promise<{ error: string | null; success: string | null }>;
  onArchive: (id: string) => Promise<{ error: string | null; success: string | null }>;
  onRestore: (id: string) => Promise<{ error: string | null; success: string | null }>;
};

export function IngredientWorkflowActions({
  ingredientId,
  status,
  isActive,
  onTransition,
  onArchive,
  onRestore,
}: IngredientWorkflowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  function runTransition(next: EditorialStatus, summary: string) {
    setError(null);
    startTransition(async () => {
      const result = await onTransition(ingredientId, next, summary);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function runArchive() {
    setError(null);
    startTransition(async () => {
      const result = await onArchive(ingredientId);
      if (result.error) setError(result.error);
      else {
        setConfirmArchive(false);
        router.refresh();
      }
    });
  }

  function runRestore() {
    setError(null);
    startTransition(async () => {
      const result = await onRestore(ingredientId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {!isActive && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          Esta ficha está <strong>retirada de consulta pública</strong>. Podés
          editarla y reactivarla cuando quieras volver a publicarla.
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Estado editorial</span>
          <EditorialStatusBadge status={status} />
          {!isActive && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Retirada
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={runRestore}
            >
              Reactivar ficha
            </Button>
          ) : (
            <>
              {status !== "draft" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    runTransition("draft", "Ficha regulatoria revertida a borrador")
                  }
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
                    runTransition(
                      "ready_for_review",
                      "Ficha regulatoria enviada a revisión"
                    )
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
                  onClick={() =>
                    runTransition("published", "Ficha regulatoria publicada")
                  }
                >
                  Publicar
                </Button>
              )}
              {confirmArchive ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={runArchive}
                  >
                    Confirmar retiro
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setConfirmArchive(false)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmArchive(true)}
                >
                  Retirar de publicación
                </Button>
              )}
            </>
          )}
        </div>

        {error && <p className="text-sm text-destructive sm:w-full">{error}</p>}
      </div>
    </div>
  );
}
