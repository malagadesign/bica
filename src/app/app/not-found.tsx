import { NotFoundContent } from "@/components/ui/not-found-content";

export default function AppNotFound() {
  return (
    <NotFoundContent
      title="Contenido no encontrado"
      description="El ingrediente, documento o listado que buscás no existe o ya no está disponible."
      backHref="/app/dashboard"
      backLabel="Volver al inicio"
    />
  );
}
