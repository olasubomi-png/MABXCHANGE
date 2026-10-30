# Account security layer

Built **on top of Neon Auth** (primary sessions). Does not replace Neon Managed Auth.

## Features

| Feature | Behavior |
|---------|----------|
| Passkeys (WebAuthn) | Register/list/revoke when signed in; step-up verification |
| TOTP | RFC 6238 authenticator apps; encrypted secret at rest; recovery codes (hashed) |
| Devices | Fingerprint tracking, revoke all |
| Step-up tokens | Short-lived tokens after passkey/TOTP for sensitive actions |
| Rate limits | In-memory per instance (not global on serverless) |

## Env (Vercel)

- `SECURITY_ENCRYPTION_KEY` — min 32 chars, encrypts TOTP secrets
- `WEBAUTHN_RP_ID` — e.g. `mabxchange.vercel.app`
- `WEBAUTHN_ORIGIN` — e.g. `https://mabxchange.vercel.app`
- `WEBAUTHN_RP_NAME` — `MABXCHANGE`

## Migration

```bash
psql "$DATABASE_URL" -f migrations/002_account_security.sql
```

## Limitations

- Passkey does **not** mint a Neon Auth session by itself (managed provider owns primary login).
- Device revoke tracks app-level devices; call Neon signOut for full session end.
- Rate limits are per serverless isolate.

## Applying security tables in production

1. Set `SECURITY_MIGRATION_SECRET` in Vercel (≥16 characters).
2. Redeploy so the migration file and admin route are live.
3. Run once:

```bash
curl -X POST "https://mabxchange.vercel.app/api/security/admin/migrate" \
  -H "x-migration-secret: $SECURITY_MIGRATION_SECRET"
```

4. Confirm JSON `tablesPresent` includes `webauthn_credentials` and `totp_secrets`.
5. Optionally remove or rotate `SECURITY_MIGRATION_SECRET` after success.

Never run destructive SQL against ledger or balance tables.

## Phase 1 hardening

- DB rate limits (`rate_limit_buckets`)
- TOTP time-step replay table (`totp_used_steps`)
- Step-up required for: remove passkey, disable TOTP, revoke all devices
- WebAuthn `userVerification: "required"`
- Neon Auth: no global session kill API wired; device revoke is app-level + honest messaging

Apply migration 003 via `/api/security/admin/migrate` (runs 002+003) after deploy.
