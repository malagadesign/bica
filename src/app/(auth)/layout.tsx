import Link from "next/link";
import { Shield, Scale, BookOpen } from "lucide-react";
import { BicaLogo } from "@/components/brand/bica-logo";
import { DisclaimerLink } from "@/components/legal/disclaimer-link";
import { FOOTER_DISCLAIMER_SHORT } from "@/lib/legal/microcopy";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[45%] flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <BicaLogo variant="inverse" showDescriptor priority />
        <div className="space-y-8">
          <blockquote className="font-serif text-2xl font-medium leading-snug tracking-tight text-primary-foreground/95">
            &ldquo;La normativa cosmética, clara y trazable para quienes
            formulan con responsabilidad.&rdquo;
          </blockquote>
          <ul className="space-y-4 text-sm text-primary-foreground/75">
            <li className="flex items-center gap-3">
              <Shield className="size-4 shrink-0" />
              Documentos normativos vinculados a cada regla
            </li>
            <li className="flex items-center gap-3">
              <Scale className="size-4 shrink-0" />
              Estado regulatorio por ingrediente
            </li>
            <li className="flex items-center gap-3">
              <BookOpen className="size-4 shrink-0" />
              Listados Argentina / MERCOSUR
            </li>
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/50">
          Plataforma oficial BICA
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <BicaLogo showDescriptor priority />
          </Link>
        </div>
        <div className="w-full max-w-sm">{children}</div>
        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
          {FOOTER_DISCLAIMER_SHORT}{" "}
          <DisclaimerLink className="text-xs text-muted-foreground hover:text-primary" />
        </p>
      </div>
    </div>
  );
}
