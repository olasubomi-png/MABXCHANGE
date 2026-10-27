# MABXCHANGE

Responsive dark-fintech homepage starter for a crypto buy/sell/swap platform.

## Current scope
- Responsive marketing homepage
- Demo market figures clearly labeled as sample data
- Trading preview is disabled
- No wallet connection, deposits, withdrawals, custody, or live trades
- No secrets required

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
1. Push this project to a private GitHub repository named `MABXCHANGE`.
2. In Vercel, choose **Add New → Project** and import that GitHub repository.
3. Keep the detected Next.js framework settings.
4. Deploy. No environment variables are needed for this demo homepage.

## Safety boundary
This repository is a UI prototype only. Do not accept customer funds or enable live transactions until legal/regulatory review, identity and sanctions controls as applicable, secure custody and key management, provider integrations, ledger accounting, reconciliation, monitoring, incident response, and independent security testing are completed.
