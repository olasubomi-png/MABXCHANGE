/**
 * Server-only WebAuthn relying-party configuration.
 * Never accept RP ID or origin from client requests.
 */

const PRODUCTION_RP_ID = "mabxchange.vercel.app";
const PRODUCTION_ORIGIN = "https://mabxchange.vercel.app";
const DEV_RP_ID = "localhost";
const DEV_ORIGIN = "http://localhost:3000";

const ALLOWED_RP_IDS = new Set([PRODUCTION_RP_ID, DEV_RP_ID]);
const ALLOWED_ORIGINS = new Set([
  PRODUCTION_ORIGIN,
  DEV_ORIGIN,
  "http://127.0.0.1:3000",
]);

function isProductionRuntime(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
    return true;
  }
  // Host-based fallback when VERCEL_URL is the production domain
  const vercelUrl = process.env.VERCEL_URL || "";
  if (vercelUrl === PRODUCTION_RP_ID || vercelUrl.endsWith(".vercel.app")) {
    // Preview deployments on *.vercel.app need matching origin; production project is fixed
    if (process.env.VERCEL_ENV === "preview") return false;
  }
  return process.env.NODE_ENV === "production" && !process.env.VERCEL_URL?.includes("localhost");
}

/**
 * Resolve RP ID. Env override is accepted only if it is in the allowlist.
 * Production defaults to mabxchange.vercel.app — never silently falls back to localhost in prod.
 */
export function getWebAuthnRpId(): string {
  const fromEnv = process.env.WEBAUTHN_RP_ID?.trim();
  if (fromEnv && ALLOWED_RP_IDS.has(fromEnv)) {
    if (isProductionRuntime() && fromEnv === DEV_RP_ID) {
      // Refuse localhost RP ID on production hosts
      return PRODUCTION_RP_ID;
    }
    return fromEnv;
  }

  if (isProductionRuntime()) {
    return PRODUCTION_RP_ID;
  }

  // Preview: use VERCEL_URL hostname when present and vercel.app
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "").split("/")[0];
    if (host.endsWith(".vercel.app")) {
      return host;
    }
  }

  return DEV_RP_ID;
}

/**
 * Resolve expected origin for verification (scheme + host, no path).
 */
export function getWebAuthnOrigin(): string {
  const fromEnv = process.env.WEBAUTHN_ORIGIN?.trim().replace(/\/$/, "");
  if (fromEnv && ALLOWED_ORIGINS.has(fromEnv)) {
    if (isProductionRuntime() && fromEnv.startsWith("http://localhost")) {
      return PRODUCTION_ORIGIN;
    }
    return fromEnv;
  }

  // Allow explicit production origin even if not in set (must match production domain only)
  if (fromEnv === PRODUCTION_ORIGIN) {
    return fromEnv;
  }

  if (isProductionRuntime()) {
    return PRODUCTION_ORIGIN;
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "").split("/")[0];
    if (host.endsWith(".vercel.app")) {
      return `https://${host}`;
    }
  }

  return DEV_ORIGIN;
}

export function getWebAuthnRpName(): string {
  const name = process.env.WEBAUTHN_RP_NAME?.trim();
  return name && name.length > 0 ? name : "MABXCHANGE";
}

/** Allowed origins list for libraries that accept an array */
export function getWebAuthnExpectedOrigins(): string[] {
  const primary = getWebAuthnOrigin();
  const set = new Set<string>([primary]);
  if (!isProductionRuntime()) {
    set.add(DEV_ORIGIN);
    set.add("http://127.0.0.1:3000");
  }
  return [...set];
}
