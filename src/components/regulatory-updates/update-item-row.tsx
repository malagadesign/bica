"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { editRegulatoryUpdateItem } from "@/modules/regulatory-updates/actions/update-actions";
import {
  CHANGE_TYPE_LABELS,
  regulatoryUpdateActionInitial,
  type RegulatoryUpdateItem,
} from "@/modules/regulatory-updates/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  item: RegulatoryUpdateItem;
  updateId: string;
  editable: boolean;
};

export function RegulatoryUpdateItemRow({ item, updateId, editable }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    editRegulatoryUpdateItem,
    regulatoryUpdateActionInitial
  );

  const payload = item.normalized_payload;
  const label =
    payload.ingredient.inci_name ||
    payload.ingredient.chemical_name ||
    item.entity_key;

  if (!editable || item.change_type === "unchanged") {
    return (
      <li className="px-4 py-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{label}</span>
          <span className="bica-pill text-xs">
            {CHANGE_TYPE_LABELS[item.change_type]}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li className="px-4 py-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.entity_key}
            {payload._meta?.manually_edited && (
              <span className="ml-2 text-primary">· Corregido manualmente</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bica-pill text-xs">
            {CHANGE_TYPE_LABELS[item.change_type]}
          </span>
          {!editing && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3" />
              Corregir
            </Button>
          )}
        </div>
      </div>

      {item.field_diff && !editing && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {Object.entries(item.field_diff).map(([field, diff]) => (
            <li key={field}>
              {field}: {String(diff.from)} → {String(diff.to)}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form action={action} className="mt-4 space-y-3 rounded-lg border border-[var(--bica-border)] bg-[var(--bica-muted)]/30 p-4">
          <input type="hidden" name="updateId" value={updateId} />
          <input type="hidden" name="itemId" value={item.id} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`${item.id}-chemical_name`} label="Nombre químico" name="chemical_name" defaultValue={payload.ingredient.chemical_name ?? ""} />
            <Field id={`${item.id}-inci_name`} label="INCI" name="inci_name" defaultValue={payload.ingredient.inci_name ?? ""} />
            <Field id={`${item.id}-cas_number`} label="CAS" name="cas_number" defaultValue={payload.ingredient.cas_number ?? ""} />
            <Field
              id={`${item.id}-max_concentration`}
              label="Concentración máx."
              name="max_concentration"
              defaultValue={
                payload.restriction?.max_concentration != null
                  ? String(payload.restriction.max_concentration)
                  : ""
              }
            />
            <Field id={`${item.id}-unit`} label="Unidad" name="unit" defaultValue={payload.restriction?.unit ?? ""} />
            <Field id={`${item.id}-notes`} label="Notas" name="notes" defaultValue={payload.notes ?? ""} />
          </div>

          <div className="bica-form-field">
            <Label htmlFor={`${item.id}-limitations`} className="bica-form-label">
              Limitaciones
            </Label>
            <textarea
              id={`${item.id}-limitations`}
              name="limitation_text"
              defaultValue={payload.restriction?.limitation_text ?? ""}
              rows={2}
              className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-[var(--bica-accent)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklch,var(--bica-accent),transparent_70%)]"
            />
          </div>

          <div className="bica-form-field">
            <Label htmlFor={`${item.id}-warnings`} className="bica-form-label">
              Advertencias
            </Label>
            <textarea
              id={`${item.id}-warnings`}
              name="warning_text"
              defaultValue={payload.restriction?.warning_text ?? ""}
              rows={2}
              className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-[var(--bica-accent)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklch,var(--bica-accent),transparent_70%)]"
            />
          </div>

          <Field
            id={`${item.id}-review_reason`}
            label="Motivo de revisión"
            name="review_reason"
            defaultValue={payload.review_reason ?? ""}
            className="sm:col-span-2"
          />

          {state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="bica-form-success text-xs">{state.success}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Guardar corrección"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}

function Field({
  id,
  label,
  name,
  defaultValue,
  className,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <div className={`bica-form-field ${className ?? ""}`}>
      <Label htmlFor={id} className="bica-form-label">
        {label}
      </Label>
      <Input id={id} name={name} defaultValue={defaultValue} />
    </div>
  );
}
