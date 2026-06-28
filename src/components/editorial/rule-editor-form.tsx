"use client";

import { useActionState } from "react";
import { editorialActionInitial } from "@/modules/editorial/types";
import { saveRuleDraft } from "@/modules/editorial/actions/rule-actions";
import type { RuleEditorData } from "@/modules/editorial/queries/rule-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  "permitted_with_limit",
  "permitted_with_scope",
  "restricted",
  "prohibited",
  "prohibited_when_condition",
  "note",
];

export function RuleEditorForm({ rule }: { rule: RuleEditorData }) {
  const [state, formAction, pending] = useActionState(
    saveRuleDraft,
    editorialActionInitial
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={rule.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule_status">Estado normativo</Label>
          <select
            id="rule_status"
            name="rule_status"
            defaultValue={rule.rule_status}
            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="conditions_raw">Condiciones (texto normativo)</Label>
          <textarea
            id="conditions_raw"
            name="conditions_raw"
            defaultValue={rule.conditions_raw ?? ""}
            rows={5}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
      </div>

      {rule.restrictions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Restricciones</h3>
          {rule.restrictions.map((r) => (
            <div key={r.id} className="rounded-lg border bg-muted/20 p-4 text-sm">
              {r.max_concentration != null && (
                <p>
                  Concentración: {r.max_concentration}{" "}
                  {r.concentration_unit ?? ""}
                </p>
              )}
              {r.application_area && <p>Área: {r.application_area}</p>}
              {r.limitation_text && <p>{r.limitation_text}</p>}
              {r.warning_text && <p>{r.warning_text}</p>}
              {r.condition_text && <p>{r.condition_text}</p>}
            </div>
          ))}
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="bica-form-success">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar borrador"}
      </Button>
    </form>
  );
}
