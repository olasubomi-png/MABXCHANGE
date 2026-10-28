# MABXCHANGE

Premium, mobile-first crypto exchange dashboard demo with Neon Managed Auth.

## Current scope

- Light fintech theme (white / grey / blue accents)
- Next.js 16 + React 19 + Tailwind 4
- Neon Managed Auth (Better Auth) — sign-up, sign-in, sign-out, sessions
- Profile page shows authenticated user data (linked to `app_users`)
- Home dashboard, Activity, Rewards remain demo UI
- Mobile bottom navigation
- Clear **Demo UI only** banners everywhere

## Important safety boundary

This repository is a **UI + auth prototype only**.

- No real balances, prices, or transactions are connected
- Deposit, Trade, Swap, and Send actions open explanatory unavailable modals
- Never accept customer funds or enable live trades until legal/regulatory review, identity controls, secure custody, ledger accounting, monitoring, and security testing are complete
- Do not invent balances or simulate successful financial operations

## Environment variables (Vercel)

| Name | Required | Notes |
|------|----------|-------|
| `DATABASE_URL` | Yes | Already configured in Vercel. Neon Postgres connection string. |
| `NEON_AUTH_BASE_URL` | Yes | `https://ep-falling-sun-b5ae4ej3.neonauth.c-7.us-east-2.aws.neon.tech/mabxchange/auth` |
| `NEON_AUTH_COOKIE_SECRET` | Yes | Generate with `openssl rand -base64 32`. Must be ≥ 32 characters. **Never commit this value.** |

Also add `https://mabxchange.vercel.app` (and your preview URLs) as trusted domains in the Neon Console → Auth → Configuration → Domains.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill the three variables above
npm run dev
```

Open http://localhost:3000.

## Verify before deployment

```bash
npm run build
npm run lint
```

## Deploy to Vercel

1. Push to `olasubomi-png/MABXCHANGE`.
2. Confirm the three environment variables are set in the Vercel project.
3. Redeploy.

## Tech stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- Neon Managed Auth (`@neondatabase/auth`)
- Neon Serverless Postgres (`@neondatabase/serverless`)
- lucide-react icons
