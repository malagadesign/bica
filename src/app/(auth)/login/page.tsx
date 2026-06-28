import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { isPublicRegistrationEnabled } from "@/lib/auth/config";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/app/dashboard";

  return (
    <Card className="bica-card border-[var(--bica-border)] shadow-[var(--card-shadow)]">
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Ingresar a BICA
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Accedé a la plataforma regulatoria de ingredientes cosméticos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params.error === "auth_callback_failed" && (
          <p className="mb-4 rounded-lg bg-[var(--badge-danger-bg)] px-3 py-2 text-sm text-[var(--badge-danger-text)]">
            Error al confirmar la sesión. Intentá nuevamente.
          </p>
        )}
        <LoginForm
          redirectTo={redirectTo}
          showRegisterLink={isPublicRegistrationEnabled()}
        />
      </CardContent>
    </Card>
  );
}
