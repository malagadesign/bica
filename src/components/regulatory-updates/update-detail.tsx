"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react";
import {
  confirmRegulatoryReview,
  publishRegulatoryUpdateAction,
  resolveRegulatoryConflict,
} from "@/modules/regulatory-updates/actions/update-actions";
import { regulatoryUpdateActionInitial } from "@/modules/regulatory-updates/types";
import type { RegulatoryUpdate, RegulatoryUpdateItem } from "@/modules/regulatory-updates/types";
import { computeImpactMetrics } from "@/lib/regulatory/impact-metrics";
import { buildUpdateTimeline } from "@/lib/regulatory/update-timeline";
import { RegulatoryContextualHelp } from "./contextual-help";
import { RegulatoryImpactSummary } from "./impact-summary";
import { RegulatoryUpdateHeader } from "./update-header";
import { RegulatoryUpdateTimeline } from "./update-timeline";
import { RegulatoryUpdateItemRow } from "./update-item-row";
import { Button } from "@/components/ui/button";
import { PUBLISH_UPDATE_VERIFICATION } from "@/lib/legal/microcopy";

type RegulatoryUpdateDetailProps = {
  update: RegulatoryUpdate;
  items: RegulatoryUpdateItem[];
  conflictItems: RegulatoryUpdateItem[];
  authorLabel: string | null;
};

export function RegulatoryUpdateDetail({
  update,
  items,
  conflictItems,
  authorLabel,
}: RegulatoryUpdateDetailProps) {
  const [reviewState, reviewAction, confirming] = useActionState(
    confirmRegulatoryReview,
    regulatoryUpdateActionInitial
  );
  const [publishState, publishAction, publishing] = useActionState(
    publishRegulatoryUpdateAction,
    regulatoryUpdateActionInitial
  );

  const isPublished = update.status === "published";
  const isReady = update.status === "ready_to_publish";
  const isInReview = update.status === "in_review";
  const canConfirmReview = isInReview && update.conflict_count === 0;
  const canPublish = isReady;
  const changedItems = items.filter((i) => i.change_type !== "unchanged");
  const impact = computeImpactMetrics(update.diff_summary, items);
  const timeline = buildUpdateTimeline(update, items, update.domain_context);

  return (
    <div className="space-y-8">
      <RegulatoryUpdateHeader update={update} authorLabel={authorLabel} />

      {!isPublished && <RegulatoryContextualHelp />}

      {update.error_message && (
        <div className="bica-callout-warning flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{update.error_message}</p>
        </div>
      )}

      <RegulatoryUpdateTimeline steps={timeline} />

      <section className="space-y-4">
        <div>
          <h2 className="bica-section-title">Resumen de impacto</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista principal del efecto de esta actualización normativa sobre la
            base publicada.
          </p>
        </div>
        <RegulatoryImpactSummary metrics={impact} />
      </section>

      {update.validation_report.warnings.length > 0 && (
        <section className="space-y-3">
          <h2 className="bica-section-title">Reporte de validación</h2>
          <div className="bica-card divide-y">
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {update.validation_report.valid_rows} de{" "}
              {update.validation_report.total_rows} registros válidos ·{" "}
              {update.validation_report.warnings.length} advertencias ·{" "}
              {update.validation_report.errors.length} errores
            </div>
            {update.validation_report.warnings.slice(0, 8).map((w, i) => (
              <p key={i} className="px-4 py-2 text-sm text-muted-foreground">
                Fila {w.row}: {w.message}
              </p>
            ))}
          </div>
        </section>
      )}

      {conflictItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="bica-section-title">
            Conflictos ({conflictItems.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Resolvé cada conflicto antes de confirmar la revisión manual.
          </p>
          <ul className="space-y-3">
            {conflictItems.map((item) => (
              <ConflictRow key={item.id} item={item} updateId={update.id} />
            ))}
          </ul>
        </section>
      )}

      {changedItems.length > 0 && (
        <section className="space-y-4">
          <h2 className="bica-section-title">
            Detalle de la propuesta ({changedItems.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisá y corregí cada activo regulatorio antes de confirmar la
            publicación.
          </p>
          <div className="bica-card overflow-hidden">
            <ul className="divide-y divide-[var(--bica-border)]">
              {changedItems.slice(0, 50).map((item) => (
                <RegulatoryUpdateItemRow
                  key={item.id}
                  item={item}
                  updateId={update.id}
                  editable={!isPublished}
                />
              ))}
            </ul>
            {changedItems.length > 50 && (
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                Mostrando 50 de {changedItems.length} registros.
              </p>
            )}
          </div>
        </section>
      )}

      {!isPublished && (
        <>
          <section className="bica-card space-y-4 p-6">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 size-5 text-primary" />
              <div>
                <h2 className="font-semibold tracking-tight">
                  Confirmar revisión manual
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Declarás que revisaste la propuesta y corregiste interpretación,
                  nombres o transcripciones. Solo entonces podrás publicar la
                  actualización normativa.
                </p>
              </div>
            </div>

            {reviewState.error && (
              <p className="text-sm text-destructive">{reviewState.error}</p>
            )}
            {reviewState.success && (
              <p className="bica-form-success">{reviewState.success}</p>
            )}

            <form action={reviewAction}>
              <input type="hidden" name="updateId" value={update.id} />
              <Button
                type="submit"
                disabled={!canConfirmReview || confirming || isReady}
                variant="secondary"
              >
                {confirming
                  ? "Confirmando…"
                  : isReady
                    ? "Revisión confirmada"
                    : "Confirmar revisión manual"}
              </Button>
            </form>
            {!canConfirmReview && update.conflict_count > 0 && (
              <p className="text-xs text-muted-foreground">
                Resolvé {update.conflict_count} conflicto(s) pendiente(s).
              </p>
            )}
          </section>

          <section className="bica-card space-y-4 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 text-primary" />
              <div>
                <h2 className="font-semibold tracking-tight">
                  Publicar actualización normativa
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paso final: incorpora los cambios validados a la base publicada
                  y registra una nueva versión normativa en el historial.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {PUBLISH_UPDATE_VERIFICATION}
                </p>
              </div>
            </div>

            {publishState.error && (
              <p className="text-sm text-destructive">{publishState.error}</p>
            )}
            {publishState.success && (
              <p className="bica-form-success">{publishState.success}</p>
            )}

            <form action={publishAction}>
              <input type="hidden" name="updateId" value={update.id} />
              <Button type="submit" disabled={!canPublish || publishing} size="lg">
                {publishing
                  ? "Publicando…"
                  : "Publicar actualización normativa"}
              </Button>
            </form>
            {!canPublish && (
              <p className="text-xs text-muted-foreground">
                {isInReview
                  ? "Confirmá la revisión manual antes de publicar."
                  : "Completá los pasos anteriores para habilitar la publicación."}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ConflictRow({
  item,
  updateId,
}: {
  item: RegulatoryUpdateItem;
  updateId: string;
}) {
  const [state, action, pending] = useActionState(
    resolveRegulatoryConflict,
    regulatoryUpdateActionInitial
  );

  const label =
    item.normalized_payload.ingredient.inci_name ||
    item.normalized_payload.ingredient.chemical_name ||
    item.entity_key;

  return (
    <li className="bica-callout-warning p-4">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm opacity-90">{item.conflict_reason}</p>
      {item.field_diff && (
        <ul className="mt-2 space-y-1 text-xs opacity-80">
          {Object.entries(item.field_diff).map(([field, diff]) => (
            <li key={field}>
              {field}: {String(diff.from)} → {String(diff.to)}
            </li>
          ))}
        </ul>
      )}
      {item.resolution && item.resolution !== "pending" ? (
        <p className="mt-3 text-xs font-medium">
          Resuelto:{" "}
          {item.resolution === "accept_update"
            ? "Aceptar actualización"
            : "Mantener publicado"}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={action}>
            <input type="hidden" name="updateId" value={updateId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="resolution" value="accept_update" />
            <Button type="submit" size="sm" variant="default" disabled={pending}>
              Aceptar actualización
            </Button>
          </form>
          <form action={action}>
            <input type="hidden" name="updateId" value={updateId} />
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="resolution" value="keep_published" />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>
              Mantener publicado
            </Button>
          </form>
        </div>
      )}
      {state.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
    </li>
  );
}
