import Link from "next/link";
import { ArrowRight, Shield, FileSearch, Layers } from "lucide-react";
import { isPublicRegistrationEnabled } from "@/lib/auth/config";
import { BicaLogo } from "@/components/brand/bica-logo";
import { PoweredByEternia } from "@/components/brand/powered-by-eternia";
import { DisclaimerLink } from "@/components/legal/disclaimer-link";
import { FOOTER_DISCLAIMER_SHORT } from "@/lib/legal/microcopy";
import { ThemeSelector } from "@/components/layout/theme-selector";

export default function LandingPage() {
  const registrationEnabled = isPublicRegistrationEnabled();

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="bica-hero-gradient flex min-h-screen flex-col justify-center px-6 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="bica-hero-logo mb-12 flex justify-center md:mb-14">
              <BicaLogo height={96} priority />
            </div>
            <p className="bica-hero-kicker mb-6">
              Plataforma regulatoria · Argentina / MERCOSUR
            </p>
            <h1 className="bica-hero-title">
              Base de Ingredientes Cosméticos Argentinos
            </h1>
            <p className="bica-hero-lead mx-auto mt-8 max-w-2xl">
              Consultá al instante el estado normativo de cada ingrediente.
              Restricciones, documentos oficiales y listados regulatorios en
              un solo lugar — con trazabilidad completa.
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {registrationEnabled ? (
                <Link href="/register" className="bica-hero-btn-primary">
                  Solicitar acceso
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </Link>
              ) : (
                <Link href="/login" className="bica-hero-btn-primary">
                  Ingresar a BICA
                  <ArrowRight className="size-4" strokeWidth={1.75} />
                </Link>
              )}
              <Link href="/login" className="bica-hero-btn-ghost">
                {registrationEnabled ? "Ya tengo cuenta" : "Acceso por invitación"}
              </Link>
              <Link href="/ayuda" className="bica-hero-btn-ghost">
                Centro de Conocimiento
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--bica-border)] py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Confianza institucional",
                description:
                  "Cada regla referencia su resolución, anexo o documento fuente oficial.",
              },
              {
                icon: FileSearch,
                title: "Precisión normativa",
                description:
                  "Ingredientes, listados y restricciones estructurados para consulta profesional.",
              },
              {
                icon: Layers,
                title: "Argentina / MERCOSUR",
                description:
                  "Normativa cosmética regional centralizada y actualizable.",
              },
            ].map((item) => (
              <div key={item.title} className="bica-card p-6">
                <item.icon className="mb-4 size-8 text-primary" strokeWidth={1.5} />
                <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--bica-border)] bg-[var(--bica-muted)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div className="text-left">
              <div className="mb-4 flex items-center gap-3">
                <ThemeSelector variant="compact" />
              </div>
              <BicaLogo height={40} showDescriptor align="start" />
              <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
                {FOOTER_DISCLAIMER_SHORT}{" "}
                <DisclaimerLink className="text-xs text-muted-foreground hover:text-primary" />
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <Link href="/ayuda" className="hover:text-primary">
                  Centro de Conocimiento
                </Link>
                {" · "}
                © {new Date().getFullYear()} BICA. Plataforma regulatoria cosmética.
              </p>
            </div>
            <PoweredByEternia height={64} align="end" className="self-end" />
          </div>
        </div>
      </footer>
    </div>
  );
}
