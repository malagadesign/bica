import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { buttonVariants } from "@/components/ui/button";
import { isPublicRegistrationEnabled } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  if (!isPublicRegistrationEnabled()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso por invitación</CardTitle>
          <CardDescription>
            El registro público no está habilitado en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            El acceso se gestiona por invitación. Contactá al administrador para
            solicitar una cuenta.
          </p>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Ir a ingresar
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Registrate para solicitar acceso a BICA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
