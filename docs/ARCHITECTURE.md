# Architecture and decisions

## Overview

```
Browser ──► Vercel (React SPA, CSP headers)
              │  /api/*  rewrite (same origin, first-party cookie)
              ▼
            Render (Express API) ──► MongoDB Atlas
                    │            ──► Cloudinary (image storage)
                    └──────────────► Claude API (optional, assistant)
```

The client is a single-page React app; all data comes from the API. The API is stateless apart from the database, so it can be restarted or scaled without losing sessions.

## Technology choices

| Choice | Why |
|---|---|
| **React 19 + Vite** | Fast dev server and small production bundles. Routes are code-split, and the admin dashboard is its own chunk, so shoppers never download it. |
| **React Router** | URL-driven state: shop filters, sort and page live in the query string, so views are shareable and the back button works. |
| **TanStack Query** | Caching, request de-duplication, loading/error states and `keepPreviousData` for smooth filtering, without a global store. Only auth, bag and toasts use React context. |
| **CSS Modules + design tokens** | A custom visual system (no UI kit or Tailwind template look). Tokens in `styles/tokens.css`; each component owns its styles. |
| **Express 5** | Native async error handling (no try/catch wrappers in every handler), mature middleware ecosystem. |
| **MongoDB + Mongoose** | Products have variable nested data (sizes, images, highlights) that maps naturally to documents. Atomic `$inc` with a conditional filter gives safe stock reservation without transactions, so it also works on a standalone local `mongod`. |
| **zod** | One schema per request validates, coerces and strips unknown keys; field messages flow straight to the forms. Also validates environment variables at boot. |
| **bcrypt + JWT in an httpOnly cookie** | Simple, stateless sessions that page scripts can't read. Roles are re-read from the database per request, and `tokenVersion` allows revocation. |
| **Cloudinary + sharp** | Cloudinary hosts and serves images from a CDN; sharp verifies and re-encodes every upload on our side first. A local-disk driver behind the same interface keeps development free of external accounts. |
| **Claude API (optional)** | The assistant uses structured JSON output so replies reliably include product slugs to render as cards. The system prompt (persona, policies, catalogue) is cached; per-shopper context rides on the latest turn. A rule-based engine answers when no key is set or the call fails. |

## Key decisions

- **Same-origin API through a Vercel rewrite.** Cross-site cookies are increasingly blocked by browsers. Proxying `/api` through the storefront domain keeps the session cookie first-party with `SameSite=Lax`, avoids CORS preflights for most requests and mirrors the Vite dev proxy, so development and production behave the same.
- **The server owns money and stock.** Carts store only product id, size and quantity. Every read re-prices from the database and reports issues per line (sold out, reduced quantity, removed product). Checkout re-prices again and reserves each line with one conditional update, releasing earlier lines if a later one fails.
- **Guest bag in the browser, account bag on the server.** Guests can shop without signing up; their bag (ids only) is priced by `POST /cart/quote` and merged into the account at sign in, capped by stock instead of failing.
- **Per-size stock.** Shirts are bought by size, so stock is tracked per size, with a derived total for listings, filters and low-stock alerts.
- **Order lines are snapshots.** Name, price, size and image are copied into the order, so editing or deleting a product never rewrites history.
- **Generated product photography.** Real club photos are copyrighted and inconsistent. `seed/jersey.js` renders front, back and close-up shots from each kit's colours and pattern, giving 108 consistent, licence-free images that go through the same upload pipeline as admin uploads.
- **Errors are designed, not dumped.** Each API error has a code and a message written for the shopper or admin; every page has loading (skeletons), empty and error (with retry) states.

## Design notes

The brand is an independent Bengaluru kit studio. The visual language comes from the stands: Big Shoulders Display (stadium signage, shirt numbers) for headlines, Instrument Sans for reading, chalk-white pages, pitch green for actions and brass for the small celebratory moments. The one bold piece is the home page's "Kit of the week" tactics board, where chalk pitch markings draw in once and the live featured shirt is pinned on with a magnet. Everything around it stays quiet. Hover on a product card shows the back of the shirt, the side fans see from the stands.

Accessibility: semantic landmarks, skip link, visible focus rings, labelled controls, `aria-live` regions for results and chat, focus trapping in dialogs and drawers, keyboard-operable search suggestions, and `prefers-reduced-motion` support.

## AI tools disclosure

This project was built with Claude (Anthropic) via Claude Code as a coding assistant: scaffolding, writing components and API code, the seed jersey renderer, documentation and tests, under my direction and review. The assistant also powers Chotu at runtime when an `ANTHROPIC_API_KEY` is configured.

## What was tested

- **Automated:** 50 API tests (`server/tests/`) covering auth, sessions, CSRF, admin authorisation, validation and injection, cart pricing, order isolation, concurrent checkout, uploads, headers and rate limiting. All pass.
- **Browser (headless Chrome):** home, shop, product, sign in/up, chat, cart drawer, checkout and order pages at 1440 px and 390 px; admin overview, products, product editor, categories and orders; the full guest bag → sign in → merge → checkout → confirmation flow; Chotu's product recommendations.
- **Manual API checks** with curl: customer sessions against admin routes, uploads without the CSRF header and with fake image files, client-sent prices being ignored.
- **Not verified:** the Claude-powered assistant path, because no API key was available during development; the rule-based assistant was used for all chat testing. Deployment to Vercel/Render needs the account setup described in the README.
