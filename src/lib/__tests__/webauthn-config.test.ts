/**
 * Run: npx tsx src/lib/__tests__/webauthn-config.test.ts
 */
function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("ok — " + msg);
}

const saved = { ...process.env };

function resetEnv() {
  for (const k of Object.keys(process.env)) {
    if (
      k.startsWith("WEBAUTHN_") ||
      k === "VERCEL_ENV" ||
      k === "VERCEL_URL" ||
      k === "VERCEL" ||
      k === "NODE_ENV"
    ) {
      delete process.env[k];
    }
  }
}

async function load() {
  // Bust module cache by dynamic import with query not available in cjs —
  // re-require after env change using fresh path not possible easily.
  // Test pure allowlist logic inline instead.
}

// Inline mirror of allowlist policy for regression
const PRODUCTION_RP_ID = "mabxchange.vercel.app";
const PRODUCTION_ORIGIN = "https://mabxchange.vercel.app";

assert(PRODUCTION_RP_ID === "mabxchange.vercel.app", "production RP ID");
assert(PRODUCTION_ORIGIN === "https://mabxchange.vercel.app", "production origin");
assert(!PRODUCTION_RP_ID.includes("localhost"), "prod RP is not localhost");

process.env = { ...saved };
process.env.VERCEL_ENV = "production";
process.env.NODE_ENV = "production";
delete process.env.WEBAUTHN_RP_ID;
delete process.env.WEBAUTHN_ORIGIN;

const { getWebAuthnOrigin, getWebAuthnRpId } = await import(
  "../security/webauthn-config.ts"
);

assert(getWebAuthnRpId() === "mabxchange.vercel.app", "prod default RP ID");
assert(
  getWebAuthnOrigin() === "https://mabxchange.vercel.app",
  "prod default origin"
);

// localhost env must not stick in production
process.env.WEBAUTHN_RP_ID = "localhost";
process.env.WEBAUTHN_ORIGIN = "http://localhost:3000";
assert(getWebAuthnRpId() === "mabxchange.vercel.app", "prod rejects localhost RP");
assert(
  getWebAuthnOrigin() === "https://mabxchange.vercel.app",
  "prod rejects localhost origin"
);

console.log("\nWebAuthn config checks passed.");
