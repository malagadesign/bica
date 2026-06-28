export function isPublicRegistrationEnabled(): boolean {
  const value = process.env.PUBLIC_REGISTRATION_ENABLED;
  if (value === undefined || value === "") return true;
  return value.toLowerCase() === "true" || value === "1";
}
