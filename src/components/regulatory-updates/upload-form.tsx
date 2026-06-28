"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Scale, FileSpreadsheet } from "lucide-react";
import { uploadRegulatoryUpdate } from "@/modules/regulatory-updates/actions/update-actions";
import { regulatoryUpdateActionInitial } from "@/modules/regulatory-updates/types";
import {
  getRegulatoryDocumentTypes,
  getRegulatorySources,
} from "@/lib/regulatory/domain-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegulatoryContextualHelp } from "./contextual-help";

const selectClassName =
  "h-9 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-[var(--bica-accent)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklch,var(--bica-accent),transparent_70%)]";

export function RegulatoryUpdateUploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadRegulatoryUpdate,
    regulatoryUpdateActionInitial
  );

  const sources = getRegulatorySources();
  const documentTypes = getRegulatoryDocumentTypes();

  return (
    <div className="space-y-6">
      <RegulatoryContextualHelp />

      <form action={formAction} className="bica-card space-y-8 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--bica-accent),transparent_88%)]">
            <Scale className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold tracking-tight text-primary">
              ¿Qué actualización normativa desea incorporar?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comenzá por identificar la normativa oficial. El documento fuente
              es soporte del proceso, no el centro del flujo.
            </p>
          </div>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-primary">
            Origen de la actualización normativa
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bica-form-field sm:col-span-2">
              <Label htmlFor="title" className="bica-form-label">
                Título
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej. Disposición 6544/2012"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Opcional si completás tipo y número normativo.
              </p>
            </div>

            <div className="bica-form-field">
              <Label htmlFor="regulatory_source_id" className="bica-form-label">
                Fuente
              </Label>
              <select
                id="regulatory_source_id"
                name="regulatory_source_id"
                className={selectClassName}
                required
                defaultValue="anmat"
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bica-form-field">
              <Label htmlFor="document_type_id" className="bica-form-label">
                Tipo documental
              </Label>
              <select
                id="document_type_id"
                name="document_type_id"
                className={selectClassName}
                required
                defaultValue="disposicion"
              >
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bica-form-field">
              <Label htmlFor="document_number" className="bica-form-label">
                Número
              </Label>
              <Input
                id="document_number"
                name="document_number"
                placeholder="Ej. 6544/2012"
              />
            </div>

            <div className="bica-form-field">
              <Label
                htmlFor="normative_published_date"
                className="bica-form-label"
              >
                Fecha de publicación
              </Label>
              <Input
                id="normative_published_date"
                name="normative_published_date"
                type="date"
              />
            </div>

            <div className="bica-form-field sm:col-span-2">
              <Label htmlFor="official_url" className="bica-form-label">
                URL oficial (opcional)
              </Label>
              <Input
                id="official_url"
                name="official_url"
                type="url"
                placeholder="https://www.argentina.gob.ar/..."
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-[var(--bica-border)] pt-6">
          <legend className="text-sm font-medium text-muted-foreground">
            Soporte documental
          </legend>

          <div className="bica-form-field">
            <Label htmlFor="file" className="bica-form-label">
              Documento fuente
            </Label>
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--bica-border)] bg-[var(--bica-muted)]/40 px-4 py-6">
              <FileSpreadsheet className="size-5 shrink-0 text-primary/60" />
              <Input
                id="file"
                name="file"
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                required
                className="border-0 bg-transparent file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Documento recibido: Excel, CSV o PDF. El análisis asistido usa este
              soporte para proponer cambios.
            </p>
          </div>

          <div className="bica-form-field">
            <Label htmlFor="notes" className="bica-form-label">
              Observaciones
            </Label>
            <Input id="notes" name="notes" placeholder="Opcional" />
          </div>
        </fieldset>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <div className="space-y-2">
            <p className="bica-form-success">{state.success}</p>
            {state.updateId && (
              <Link
                href={`/app/admin/regulatory-updates/${state.updateId}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ver actualización normativa →
              </Link>
            )}
          </div>
        )}

        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Analizando normativa…" : "Incorporar normativa"}
        </Button>
      </form>
    </div>
  );
}
