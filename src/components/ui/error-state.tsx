import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos completar la operación. Intentá de nuevo en unos segundos.",
  showRetry = false,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center",
        "border-[color-mix(in_oklch,var(--badge-danger-ring),transparent_50%)]",
        "bg-[color-mix(in_oklch,var(--badge-danger-bg),transparent_40%)]",
        className
      )}
    >
      <div
        className="flex size-12 items-center justify-center rounded-2xl"
        style={{
          background: "var(--badge-danger-bg)",
          color: "var(--badge-danger-text)",
        }}
      >
        <AlertCircle className="size-5" strokeWidth={1.5} />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {showRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
          >
            <RefreshCw className="size-3.5" />
            Reintentar
          </button>
        )}
        <Link
          href="/app/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <Home className="size-3.5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
