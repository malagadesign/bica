"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <ErrorState
          title="No pudimos cargar esta sección"
          description="Hubo un problema al obtener la información regulatoria. Intentá de nuevo."
          showRetry
          onRetry={reset}
        />
      </div>
    </main>
  );
}
