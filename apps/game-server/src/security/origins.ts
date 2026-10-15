export function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
export function isAllowedOrigin(origin: string | null) {
  if (process.env.NODE_ENV !== "production") return true;
  // A non-browser SDK still needs an authenticated workspace session in onAuth.
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}
