# ClearNote Frontend

Clinical web portal for **ClearNote**, built with **Next.js 16.2.6 (App Router)**, **React 19**, **TypeScript 5**, **Tailwind CSS v4**, **TanStack React Query v5**, **Clerk**, and **Base UI**.

## Fonts & Design System

- Typography uses **Plus Jakarta Sans** (`--font-sans`) and **JetBrains Mono** (`--font-mono`) via `next/font/google` in `src/app/layout.tsx`.
- Design principles and component architecture are documented in [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) and [../docs/DESIGN_PRINCIPLES.md](../docs/DESIGN_PRINCIPLES.md).

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Start Next.js dev server (`NODE_OPTIONS='--max-old-space-size=4096' next dev`) |
| `npm run build` | Build production bundle |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint checks |
| `npm run test:e2e` | Run Playwright E2E suite (`tests/e2e/`) |
| `npx tsc --noEmit` | Run strict TypeScript type-checking |

## Required Environment Variables (`frontend/.env`)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_API_URL` / `API_URL`
