import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotFoundContentProps = {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function NotFoundContent({
  title = "Página no encontrada",
  description = "El recurso que buscás no existe o fue movido.",
  backHref = "/app/dashboard",
  backLabel = "Volver al inicio",
}: NotFoundContentProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="bica-empty-icon">
        <FileQuestion className="size-6" strokeWidth={1.5} />
      </div>
      <p className="bica-kicker mt-8">BICA</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Link
        href={backHref}
        className={cn(buttonVariants({ variant: "default", size: "sm" }), "mt-8 gap-2")}
      >
        <Home className="size-4" />
        {backLabel}
      </Link>
    </div>
  );
}
