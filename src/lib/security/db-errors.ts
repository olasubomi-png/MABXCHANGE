/**
 * Sanitize database errors for API clients.
 * Never return raw SQL, relation names, or stack traces to the browser.
 */

export function publicSecurityError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const lower = raw.toLowerCase();

  if (
    lower.includes("does not exist") ||
    lower.includes("undefined_table") ||
    lower.includes("relation")
  ) {
    return "Security storage is not ready. Please try again after setup is complete.";
  }
  if (lower.includes("database_url") || lower.includes("connect")) {
    return "Security service temporarily unavailable.";
  }
  if (lower.includes("security_encryption_key")) {
    return "Security encryption is not configured.";
  }
  if (
    lower.includes("invalid or expired") ||
    lower.includes("verification failed") ||
    lower.includes("unknown passkey") ||
    lower.includes("does not belong")
  ) {
    return raw;
  }
  // Known user-facing validation messages pass through if short and clean
  if (
    raw.length < 120 &&
    !lower.includes("select ") &&
    !lower.includes("insert ") &&
    !lower.includes("update ") &&
    !/"[^"]+"/.test(raw)
  ) {
    return raw;
  }
  return fallback;
}
