import Link from "next/link";
import { Shield, Scale, BookOpen } from "lucide-react";
import { BicaLogo } from "@/components/brand/bica-logo";
import { DisclaimerLink } from "@/components/legal/disclaimer-link";
import { FOOTER_DISCLAIMER_SHORT } from "@/lib/legal/microcopy";
import { ThemeSelector } from "@/components/layout/theme-selector";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="bica-hero-gradient hidden w-[45%] flex-col justify-between p-10 lg:flex">
        <BicaLogo variant="inverse" showDescriptor priority align="start" />
        <div className="space-y-10">
          <blockquote className="bica-auth-quote">
            &ldquo;La normativa cosmética, clara y trazable para quienes
            formulan con responsabilidad.&rdquo;
          </blockquote>
          <ul className="space-y-4 text-sm" style={{ color: "var(--hero-muted)" }}>
            <li className="flex items-center gap-3">
              <Shield className="size-4 shrink-0 opacity-90" />
              Documentos normativos vinculados a cada regla
            </li>
            <li className="flex items-center gap-3">
              <Scale className="size-4 shrink-0 opacity-90" />
              Estado regulatorio por ingrediente
            </li>
            <li className="flex items-center gap-3">
              <BookOpen className="size-4 shrink-0 opacity-90" />
              Listados Argentina / MERCOSUR
            </li>
          </ul>
        </div>
        <p
          className="text-xs"
          style={{ color: "color-mix(in oklch, var(--hero-fg), transparent 45%)" }}
        >
          Plataforma oficial BICA
        </p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="absolute right-6 top-6">
          <ThemeSelector variant="compact" />
        </div>
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
