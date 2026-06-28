"use client";

import { useActionState } from "react";
import { editorialActionInitial } from "@/modules/editorial/types";
import { saveDocumentDraft } from "@/modules/editorial/actions/document-actions";
import type { DocumentEditorData } from "@/modules/editorial/queries/document-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentEditorForm({ doc }: { doc: DocumentEditorData }) {
  const [state, formAction, pending] = useActionState(
    saveDocumentDraft,
    editorialActionInitial
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={doc.id} />

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" defaultValue={doc.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document_number">Número</Label>
          <Input
            id="document_number"
            name="document_number"
            defaultValue={doc.document_number ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Autoridad</Label>
          <Input value={doc.authorityName} disabled className="bg-muted/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Resumen</Label>
          <textarea
            id="summary"
            name="summary"
            defaultValue={doc.summary ?? ""}
            rows={5}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
      </div>

      {doc.lists.length > 0 && (
        <div className="space-y-2">
          <Label>Listas regulatorias vinculadas</Label>
          <ul className="flex flex-wrap gap-2">
            {doc.lists.map((l) => (
              <li
                key={l.id}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {l.name}
              </li>
            ))}
          </ul>
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
