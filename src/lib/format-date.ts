export function formatLastUpdated(iso: string | null): string {
  if (!iso) return "sin registros recientes";

  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "hace un momento";
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "hace 1 minuto" : `hace ${diffMinutes} minutos`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
  }
  if (diffDays < 7) {
    return diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
