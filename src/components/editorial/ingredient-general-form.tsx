"use client";

import { useActionState } from "react";
import { editorialActionInitial } from "@/modules/editorial/types";
import { saveIngredientDraft } from "@/modules/editorial/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IngredientEditorData } from "@/modules/editorial/queries/ingredient-editor";

type IngredientGeneralFormProps = {
  ingredient: IngredientEditorData;
};

export function IngredientGeneralForm({ ingredient }: IngredientGeneralFormProps) {
  const [state, formAction, pending] = useActionState(
    saveIngredientDraft,
    editorialActionInitial
  );

  return (
    <form
      key={ingredient.editorial_updated_at ?? ingredient.id}
      action={formAction}
      className="space-y-6"
    >
      <input type="hidden" name="id" value={ingredient.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bica-form-field sm:col-span-2">
          <Label htmlFor="inci_name" className="bica-form-label">Nombre INCI</Label>
          <Input
            id="inci_name"
            name="inci_name"
            defaultValue={ingredient.inci_name ?? ""}
          />
        </div>
        <div className="bica-form-field sm:col-span-2">
          <Label htmlFor="chemical_name" className="bica-form-label">Nombre químico</Label>
          <Input
            id="chemical_name"
            name="chemical_name"
            defaultValue={ingredient.chemical_name ?? ""}
          />
        </div>
        <div className="bica-form-field">
          <Label htmlFor="cas_number" className="bica-form-label">CAS</Label>
          <Input
            id="cas_number"
            name="cas_number"
            defaultValue={ingredient.cas_number ?? ""}
          />
        </div>
        <div className="bica-form-field">
          <Label htmlFor="color_index" className="bica-form-label">Color Index</Label>
          <Input
            id="color_index"
            name="color_index"
            defaultValue={ingredient.color_index ?? ""}
          />
        </div>
        <div className="bica-form-field">
          <Label htmlFor="einecs" className="bica-form-label">EINECS / EC</Label>
          <Input
            id="einecs"
            name="einecs"
            defaultValue={ingredient.einecs ?? ""}
          />
        </div>
        <div className="bica-form-field">
          <Label htmlFor="function" className="bica-form-label">Función</Label>
          <Input
            id="function"
            name="function"
            defaultValue={ingredient.function ?? ""}
          />
        </div>
        <div className="bica-form-field sm:col-span-2">
          <Label htmlFor="notes" className="bica-form-label">Notas</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={ingredient.notes ?? ""}
            rows={4}
            className="bica-form-textarea"
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="bica-form-success">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Al guardar, la ficha vuelve a borrador hasta que la publiques nuevamente.
      </p>
    </form>
  );
}
