import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { BicaLogo } from "@/components/brand/bica-logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccessDisabledPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("access_status, access_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const isExpired =
    profile?.access_expires_at != null &&
    new Date(profile.access_expires_at) <= new Date();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-6 py-12">
      <div className="mb-8">
        <BicaLogo height={44} showDescriptor />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Acceso no activo</CardTitle>
          <CardDescription>
            Tu cuenta no tiene acceso habilitado en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Tu acceso no está activo. Contactá al administrador para renovar o
            habilitar tu cuenta.
          </p>

          {profile?.access_status === "pending" && (
            <p className="bica-callout-warning text-center">
              Tu registro está pendiente de aprobación.
            </p>
          )}

          {profile?.access_status === "suspended" && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-destructive">
              Tu cuenta fue suspendida.
            </p>
          )}

          {isExpired && (
            <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Tu acceso venció el{" "}
              {new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
                new Date(profile!.access_expires_at!)
              )}
              .
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Volver a ingresar
            </Link>
            <LogoutButton variant="ghost" className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
