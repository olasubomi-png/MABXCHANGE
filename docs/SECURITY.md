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
