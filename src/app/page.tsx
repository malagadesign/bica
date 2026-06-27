import Link from "next/link";
import { FlaskConical, ArrowRight, Shield, FileSearch, Layers } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FlaskConical className="size-5" />
            Cosing AR
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Ingresar
            </Link>
            <Link href="/register" className={cn(buttonVariants())}>
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Plataforma regulatoria cosmética
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Consultá ingredientes y normativas con precisión
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Cosing AR centraliza regulaciones de MERCOSUR, ANMAT, Unión Europea
              y más. Cada dato trazable a su documento normativo oficial.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "inline-flex items-center")}
              >
                Comenzar
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              >
                Ingresar
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-24">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="mb-2 size-8 text-primary" />
                <CardTitle>Confianza</CardTitle>
                <CardDescription>
                  Cada regla referencia su resolución, anexo o documento fuente.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileSearch className="mb-2 size-8 text-primary" />
                <CardTitle>Precisión</CardTitle>
                <CardDescription>
                  Ingredientes, listas regulatorias y restricciones estructuradas.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Layers className="mb-2 size-8 text-primary" />
                <CardTitle>Multi-jurisdicción</CardTitle>
                <CardDescription>
                  Un solo lugar para consultar múltiples organismos regulatorios.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <Card className="mx-auto max-w-2xl border-dashed">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Etapa 0 — Fundación del producto. Buscador, importador y
                  comparador regulatorio disponibles en próximas etapas.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cosing AR
        </div>
      </footer>
    </div>
  );
}
