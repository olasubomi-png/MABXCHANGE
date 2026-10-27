# MABXCHANGE

Premium, mobile-first crypto exchange dashboard demo.

## Current scope

- Light fintech theme (white / grey / blue accents)
- Home dashboard: greeting, balance card (hide/show), NGN/USD toggle, Deposit / Trade / Swap / Send actions, holdings list
- Activity page with type & status filters and empty state
- Rewards and Profile placeholder pages
- Mobile bottom navigation (Home · Activity · Rewards · Profile)
- Clear **Demo UI only** banners everywhere

## Important safety boundary

This repository is a **UI prototype only**.

- No real balances, prices, or transactions are connected
- Deposit, Trade, Swap, and Send actions open explanatory unavailable modals
- Never accept customer funds or enable live trades until legal/regulatory review, identity controls, secure custody, ledger accounting, monitoring, and security testing are complete
- Do not invent balances or simulate successful financial operations

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Verify before deployment

```bash
npm run build
npm run lint
```

## Deploy to Vercel

1. Push this project to your GitHub repository (`olasubomi-png/MABXCHANGE`).
2. In Vercel → **Add New → Project** and import the repository.
3. Keep the detected Next.js framework settings.
4. Deploy. **No environment variables are required** for this demo dashboard.

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- TypeScript
- lucide-react icons
