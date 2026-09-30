# TradeView Lite

A stock watchlist dashboard exploring the newer end of the GraphQL/Next.js ecosystem, built on top of real prior fintech-dashboard experience rather than an arbitrary CRUD tutorial app.

## Why this exists

GraphQL and Next.js were already part of an earlier project; this one exists to work through what's changed in the newer major versions of both — Next.js 16's App Router/caching model, Apollo Client v4's split packages, TanStack Table v9's rewritten core API — and to push AI-assisted development further end-to-end (see below), while staying close to a real problem space (financial dashboards) rather than a generic CRUD app.

## Architecture

Full design reasoning, including the cross-review rounds and the fixes that came out of them, lives in [`docs/architecture.md`](docs/architecture.md). Summary:

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (Radix primitives)
- **Data layer:** Self-hosted GraphQL BFF (Apollo Server via `@as-integrations/next`, mounted as a Route Handler so `fetch`'s Data Cache actually applies) wrapping Financial Modeling Prep's REST API
- **State:** Zustand with `persist` middleware for global state + localStorage sync in one mechanism; Apollo Client's own `useQuery`/`pollInterval` for server state (deliberately not TanStack Query, which would be redundant here); React Hook Form + Zod for the add-ticker form
- **Watchlist:** TanStack Table (v9) + TanStack Virtual for a virtualized, sortable grid
- **Charts:** visx + D3 scales for price history

## Two data modes

The app has a **Mock mode** (default, always safe) and a **Real mode** (Financial Modeling Prep, free tier: 250 calls/day). Mock is the default everywhere specifically so local development and demos never burn the real quota by accident. Toggle in the UI header.

FMP's free tier has no batch-quote endpoint (verified directly against the live API — it's paid-plan-only), so Real mode is one API call per symbol, and client-side polling is disabled entirely in Real mode to protect the 250/day quota: it fetches once per toggle or watchlist change instead of continuously polling like Mock mode does.

## AI-assisted development

Built using Claude Code, with a deliberate three-round architecture review process before writing implementation code: the initial design was cross-checked by an independent model, concerns were resolved with concrete fixes (cache mechanism, rate-limit math, SSR framing), then re-reviewed. The build itself surfaced and fixed real version-drift issues (Next.js 16's Cache Components model, Apollo Client v4's split React package, TanStack Table v9's different core API) by reading the installed packages' own docs/skill files rather than assuming prior training data was current — verified with a working build and a real browser screenshot before calling anything done.

## Getting started

```bash
bun install
bun run dev
```

Mock mode works immediately, no API key needed. To try Real mode, add a Financial Modeling Prep API key to `.env.local`:

```
MARKET_DATA_API_KEY=your_key_here
```

## Testing & CI

```bash
bun run test       # unit tests (bun test) - validation, store, mock + real data sources
bun run test:e2e   # e2e (Playwright) - dashboard/watchlist/Markets/Settings flows,
                    # plus an axe-core accessibility audit on every route
bun run lint
bun run audit       # bun audit - dependency vulnerabilities
```

The e2e suite runs exclusively against Mock mode — Real mode needs a live FMP key (never committed, absent in CI) and would otherwise burn the daily quota on every run. GitHub Actions (`.github/workflows/ci.yml`) runs all of the above — lint, unit tests, build, e2e + accessibility audit, security audit — on every push and PR to `main`.

## What's deliberately out of scope

No auth, no database (Zustand + localStorage only), no i18n, and no SSR/RSC data-fetching pattern (GraphQL is fetched client-side via Apollo, even though the app runs on Next.js). These are conscious scope cuts, not oversights — the point of this project is depth on GraphQL/Next.js/state-management trade-offs and a real test/CI pipeline, not breadth.
