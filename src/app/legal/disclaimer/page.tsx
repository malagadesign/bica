import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BicaLogo } from "@/components/brand/bica-logo";
import {
  DISCLAIMER_GENERAL,
  DISCLAIMER_HUMAN_REVIEW,
  DISCLAIMER_OFFICIAL_SOURCES_NOTE,
  ETERNIA_CONTACT,
  OFFICIAL_SOURCES,
} from "@/lib/legal/disclaimer-content";

export const metadata: Metadata = {
  title: "Aviso legal — BICA",
  description:
    "Información sobre el carácter informativo de BICA y las fuentes oficiales de normativa cosmética.",
};

export default function LegalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[var(--bica-border)] px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <BicaLogo height={36} showDescriptor />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="space-y-10">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Aviso legal
            </h1>
            <p className="text-sm text-muted-foreground">
              Base de Ingredientes Cosméticos Argentinos (BICA)
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Carácter informativo
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DISCLAIMER_GENERAL}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DISCLAIMER_OFFICIAL_SOURCES_NOTE}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Fuentes oficiales
            </h2>
            <p className="text-sm text-muted-foreground">
              BICA distingue entre ingredientes, sustancias, reglas regulatorias,
              restricciones y documentos normativos para facilitar la consulta
              técnica. La normativa oficial vigente prevalece siempre sobre la
              información organizada en esta plataforma.
            </p>
            <ul className="space-y-2 text-sm">
              {OFFICIAL_SOURCES.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Revisión y responsabilidad
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {DISCLAIMER_HUMAN_REVIEW}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Antes de tomar decisiones regulatorias, comerciales o de
              formulación, la información debe ser verificada contra la normativa
              oficial vigente y, cuando corresponda, con asesoramiento profesional
              especializado.
            </p>
          </section>

          <section className="space-y-4 border-t border-[var(--bica-border)] pt-8">
            <h2 className="text-lg font-semibold tracking-tight">Gestión</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">
                {ETERNIA_CONTACT.name}
              </strong>
              <br />
              {ETERNIA_CONTACT.description}
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
