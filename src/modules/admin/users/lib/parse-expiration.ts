export function parseAccessExpiresAt(
  value: FormDataEntryValue | null
): string | null {
  const raw = (value as string)?.trim();
  if (!raw) return null;
  return new Date(raw).toISOString();
}
