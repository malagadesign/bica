"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <ErrorState
        title="Error inesperado"
        description="Ocurrió un problema al cargar la página. Podés reintentar o volver al inicio."
        showRetry
        onRetry={reset}
      />
    </main>
  );
}
