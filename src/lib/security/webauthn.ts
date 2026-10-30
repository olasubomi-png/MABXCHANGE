/**
 * Server-side WebAuthn (passkeys). Biometrics never leave the device.
 */
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from "./webauthn-types";
import {
  getWebAuthnExpectedOrigins,
  getWebAuthnOrigin,
  getWebAuthnRpId,
  getWebAuthnRpName,
} from "./webauthn-config";
import { Pool } from "@neondatabase/serverless";
import { randomToken } from "./crypto";

function rpID(): string {
  return getWebAuthnRpId();
}

function rpName(): string {
  return getWebAuthnRpName();
}

function origin(): string {
  return getWebAuthnOrigin();
}

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return new Pool({ connectionString: url });
}

async function storeChallenge(
  userId: string | null,
  challenge: string,
  type: string
): Promise<void> {
  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `INSERT INTO webauthn_challenges (user_id, challenge, type, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [userId, challenge, type]
    );
  } finally {
    client.release();
    await p.end();
  }
}

async function consumeChallenge(
  challenge: string,
  type: string
): Promise<{ userId: string | null } | null> {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `UPDATE webauthn_challenges
       SET consumed_at = NOW()
       WHERE challenge = $1
         AND type = $2
         AND consumed_at IS NULL
         AND expires_at > NOW()
       RETURNING user_id`,
      [challenge, type]
    );
    if (!res.rows[0]) return null;
    return { userId: res.rows[0].user_id ? String(res.rows[0].user_id) : null };
  } finally {
    client.release();
    await p.end();
  }
}

export async function beginPasskeyRegistration(userId: string, userName: string) {
  const p = pool();
  const client = await p.connect();
  let existing: { id: string; transports: string | null }[] = [];
  try {
    const res = await client.query(
      `SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1`,
      [userId]
    );
    existing = res.rows.map((r) => ({
      id: String(r.credential_id),
      transports: r.transports as string | null,
    }));
  } finally {
    client.release();
    await p.end();
  }

  const options = await generateRegistrationOptions({
    rpName: rpName(),
    rpID: rpID(),
    userName,
    userDisplayName: userName,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.id,
      transports: c.transports
        ? (c.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });

  await storeChallenge(userId, options.challenge, "registration");
  return options;
}

export async function finishPasskeyRegistration(params: {
  userId: string;
  response: RegistrationResponseJSON;
  name?: string;
}) {
  const expected = params.response.response.clientDataJSON;
  // Verify using challenge from response after parse — SimpleWebAuthn expects challenge match
  const clientData = JSON.parse(
    Buffer.from(params.response.response.clientDataJSON, "base64url").toString(
      "utf8"
    )
  ) as { challenge: string };

  const consumed = await consumeChallenge(clientData.challenge, "registration");
  if (!consumed || consumed.userId !== params.userId) {
    throw new Error("Invalid or expired registration challenge");
  }

  const verification = await verifyRegistrationResponse({
    response: params.response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
    expectedChallenge: clientData.challenge,
    expectedOrigin: getWebAuthnExpectedOrigins(),
    expectedRPID: rpID(),
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration verification failed");
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const p = pool();
  const client = await p.connect();
  try {
    await client.query(
      `INSERT INTO webauthn_credentials (
         user_id, credential_id, public_key, counter, transports,
         device_type, backed_up, name, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        params.userId,
        credential.id,
        Buffer.from(credential.publicKey).toString("base64url"),
        credential.counter,
        credential.transports?.join(",") ?? null,
        credentialDeviceType,
        credentialBackedUp,
        params.name?.trim() || "Passkey",
      ]
    );
  } finally {
    client.release();
    await p.end();
  }

  return { ok: true as const };
}

export async function beginPasskeyAuthentication(userId?: string) {
  const p = pool();
  const client = await p.connect();
  let allow: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
  try {
    if (userId) {
      const res = await client.query(
        `SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1`,
        [userId]
      );
      allow = res.rows.map((r) => ({
        id: String(r.credential_id),
        transports: r.transports
          ? (String(r.transports).split(",") as AuthenticatorTransportFuture[])
          : undefined,
      }));
    }
  } finally {
    client.release();
    await p.end();
  }

  const options = await generateAuthenticationOptions({
    rpID: rpID(),
    userVerification: "required",
    allowCredentials: allow.length ? allow : undefined,
  });

  await storeChallenge(userId ?? null, options.challenge, "authentication");
  return options;
}

export async function finishPasskeyAuthentication(params: {
  response: AuthenticationResponseJSON;
  expectedUserId?: string;
}): Promise<{ userId: string; credentialId: string }> {
  const clientData = JSON.parse(
    Buffer.from(params.response.response.clientDataJSON, "base64url").toString(
      "utf8"
    )
  ) as { challenge: string };

  const consumed = await consumeChallenge(clientData.challenge, "authentication");
  if (!consumed) {
    throw new Error("Invalid or expired authentication challenge");
  }

  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT id, user_id, credential_id, public_key, counter, transports
       FROM webauthn_credentials WHERE credential_id = $1 LIMIT 1`,
      [params.response.id]
    );
    const row = res.rows[0];
    if (!row) throw new Error("Unknown passkey");
    if (params.expectedUserId && String(row.user_id) !== params.expectedUserId) {
      throw new Error("Passkey does not belong to this account");
    }

    const verification = await verifyAuthenticationResponse({
      response: params.response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge: clientData.challenge,
      expectedOrigin: getWebAuthnExpectedOrigins(),
      expectedRPID: rpID(),
      credential: {
        id: String(row.credential_id),
        publicKey: Buffer.from(String(row.public_key), "base64url"),
        counter: Number(row.counter),
        transports: row.transports
          ? (String(row.transports).split(",") as AuthenticatorTransportFuture[])
          : undefined,
      },
    });

    if (!verification.verified) {
      throw new Error("Passkey verification failed");
    }

    const newCounter = verification.authenticationInfo.newCounter;
    await client.query(
      `UPDATE webauthn_credentials SET counter = $1, last_used_at = NOW() WHERE id = $2`,
      [newCounter, row.id]
    );

    return { userId: String(row.user_id), credentialId: String(row.credential_id) };
  } finally {
    client.release();
    await p.end();
  }
}

export async function listPasskeys(userId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `SELECT id, name, device_type, backed_up, created_at, last_used_at
       FROM webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      deviceType: r.device_type ? String(r.device_type) : null,
      backedUp: Boolean(r.backed_up),
      createdAt: r.created_at,
      lastUsedAt: r.last_used_at,
    }));
  } finally {
    client.release();
    await p.end();
  }
}

export async function revokePasskey(userId: string, passkeyId: string) {
  const p = pool();
  const client = await p.connect();
  try {
    const res = await client.query(
      `DELETE FROM webauthn_credentials WHERE id = $1 AND user_id = $2 RETURNING id`,
      [passkeyId, userId]
    );
    return Boolean(res.rows[0]);
  } finally {
    client.release();
    await p.end();
  }
}

export { randomToken };
