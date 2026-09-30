# TradeView Lite

A stock watchlist dashboard built as a focused, resume-driven project, deliberately scoped to close two real gaps (GraphQL, Next.js) and extend real fintech-dashboard experience, rather than a generic tutorial app.

## Why this exists

Built alongside an active job search where several JDs named GraphQL and Next.js explicitly, and several more named AI-assisted development tooling as a core requirement. This project closes the first two gaps directly and demonstrates the third (see "AI-assisted development" below), while staying close to real prior experience: a financial-dashboard problem space, not an arbitrary CRUD app.

## Architecture

Full design reasoning, including three rounds of independent cross-review and the fixes that came out of them, lives in [`docs/architecture.html`](docs/architecture.html) — open it in a browser. Summary:

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (Radix primitives)
- **Data layer:** Self-hosted GraphQL BFF (Apollo Server via `@as-integrations/next`, mounted as a Route Handler so `fetch`'s Data Cache actually applies) wrapping Financial Modeling Prep's REST API
- **State:** Zustand with `persist` middleware for global state + localStorage sync in one mechanism; Apollo Client's own `useQuery`/`pollInterval` for server state (deliberately not TanStack Query, which would be redundant here); React Hook Form + Zod for the add-ticker form
- **Watchlist:** TanStack Table (v9) + TanStack Virtual for a virtualized, sortable grid
- **Charts:** visx + D3 scales for price history

## Two data modes

The app has a **Mock mode** (default, always safe) and a **Real mode** (Financial Modeling Prep, free tier: 250 calls/day). Mock is the default everywhere specifically so local development and demos never burn the real quota by accident. Toggle in the UI header.

FMP has a genuine batch-quote endpoint, so Real mode issues one API call for the entire watchlist per poll, not one call per ticker.

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

## What's deliberately out of scope

No auth, no database (Zustand + localStorage only), and testing is a couple of targeted tests rather than full coverage. These are conscious scope cuts, not oversights, the point of this project is depth on GraphQL/Next.js/state-management trade-offs, not breadth.
