import { Info } from "lucide-react";

export function RegulatoryContextualHelp() {
  return (
    <div className="bica-card flex gap-3 p-5">
      <Info className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-primary">
          Revisión asistida con control humano
        </p>
        <p>
          BICA nunca publica automáticamente una nueva normativa. Cada
          actualización es analizada, propuesta para revisión y validada
          manualmente por un especialista antes de incorporarse a la base
          publicada.
        </p>
      </div>
    </div>
  );
}
