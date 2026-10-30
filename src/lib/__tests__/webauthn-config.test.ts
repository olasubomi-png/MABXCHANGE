/**
 * WebAuthn RP config checks.
 * Run: npx tsx src/lib/__tests__/webauthn-config.test.ts
 */

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`ok — ${msg}`);
}

async function main(): Promise<void> {
  const keys = [
    "WEBAUTHN_RP_ID",
    "WEBAUTHN_ORIGIN",
    "WEBAUTHN_RP_NAME",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL",
  ] as const;

  const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {};
  for (const key of keys) {
    saved[key] = process.env[key];
  }

  try {
    // Production defaults (do not modify NODE_ENV)
    process.env.VERCEL_ENV = "production";
    delete process.env.WEBAUTHN_RP_ID;
    delete process.env.WEBAUTHN_ORIGIN;
    delete process.env.VERCEL_URL;

    // Dynamic import after env is set; no .ts extension
    const { getWebAuthnOrigin, getWebAuthnRpId } = await import(
      "../security/webauthn-config"
    );

    assert(getWebAuthnRpId() === "mabxchange.vercel.app", "prod default RP ID");
    assert(
      getWebAuthnOrigin() === "https://mabxchange.vercel.app",
      "prod default origin"
    );

    // Localhost overrides must be rejected in production
    process.env.WEBAUTHN_RP_ID = "localhost";
    process.env.WEBAUTHN_ORIGIN = "http://localhost:3000";
    assert(
      getWebAuthnRpId() === "mabxchange.vercel.app",
      "prod rejects localhost RP"
    );
    assert(
      getWebAuthnOrigin() === "https://mabxchange.vercel.app",
      "prod rejects localhost origin"
    );

    console.log("\nWebAuthn config checks passed.");
  } finally {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
