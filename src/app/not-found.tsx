import { NotFoundContent } from "@/components/ui/not-found-content";

export default function NotFound() {
  return (
    <NotFoundContent
      title="Página no encontrada"
      description="La dirección que ingresaste no existe en BICA."
      backHref="/"
      backLabel="Ir al sitio"
    />
  );
}
