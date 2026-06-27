import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/app/dashboard";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresar</CardTitle>
        <CardDescription>
          Accedé a la plataforma regulatoria cosmética.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {params.error === "auth_callback_failed" && (
          <p className="mb-4 text-sm text-destructive">
            Error al confirmar la sesión. Intentá nuevamente.
          </p>
        )}
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
    </Card>
  );
}
