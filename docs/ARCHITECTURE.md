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
- **Per-size stock with free-text size labels.** Stock is tracked per size, with a derived total for listings, filters and low-stock alerts. Labels are free text (validated) so each category uses its natural run: UK shoe sizes, XS–XXL, or One size. The admin editor offers presets for each.
- **Ratings stored on the product.** Average and count are recalculated when a review is added or removed, so listings can sort and filter by rating without aggregating reviews on every request.
- **Wishlist in the browser.** Saved items are slugs in localStorage; the page fetches fresh prices and stock with one `?slugs=` request. No account needed, nothing stale.
- **Order lines are snapshots.** Name, price, size and image are copied into the order, so editing or deleting a product never rewrites history.
- **Real product photography from open data.** `seed/fetchCatalog.js` pulls 52 products and their studio photos (1000 × 1000, white background) from DummyJSON, an open-source mock-data API, converts prices to rupees and maps placeholder brands to a few house labels. The data and images are committed so seeding works offline, and every image goes through the same validation and upload pipeline as admin uploads.
- **Errors are designed, not dumped.** Each API error has a code and a message written for the shopper or admin; every page has loading (skeletons), empty and error (with retry) states.

## Design notes

Terrace is an independent sport and street store from Bengaluru. The design is deliberately quiet so the products carry the colour: soft cream pages, warm white surfaces, near-black type and primary buttons, with deep green and brass used only for small moments (a status dot, a verified badge, the sale kicker). One typeface, Inter Tight, runs through the site: tight and medium weight for headlines in sentence case, a touch wider for body text.

Product photos are shot on white, so every image is multiplied onto the same soft grey "well". That removes the white boxes and makes shoes, watches and cricket bats sit on one consistent surface, like a well-lit shop shelf.

The home page opens like an editorial: a **full-screen photograph** with a short headline revealed line by line and one call to action, then alternates product-led sections with **full-width photo bands** whose photos cross-fade slowly, with a gentle zoom and a sweep of warm light, while the band drifts with the scroll and a **scroll story** where a sticky photo changes as each chapter reaches the middle of the screen. Scroll effects write a single CSS variable (`hooks/useScrollProgress.js`), so scrolling never re-renders React.

Interaction is used where it helps someone decide, not for decoration:
- the hero's **dotted pointers** lead from the watch and the wardrobe to an "Order now" link;
- the **category explorer** swaps a large picture as you hover each department;
- product cards show the **second photo on hover** and offer **quick add** without leaving the grid;
- the **mega menu** and **search overlay** (press `/`) get people to the right shelf fast;
- the product page has **hover zoom**, a **size guide** that matches the product (shoes or clothing), a **delivery estimate** that counts down to the 2 pm dispatch cut-off, and **reviews** with a star breakdown.

Motion is limited to short transitions that confirm an action (drawer, toast, bag count bump, image swap) and respects `prefers-reduced-motion`.

Accessibility: semantic landmarks, skip link, visible focus rings, labelled controls, `aria-live` regions for results and chat, focus trapping in dialogs and drawers, keyboard-operable menus, tabs and search, radio-group size and star pickers, and alt text on product images.

## AI tools disclosure

This project was built with Claude (Anthropic) via Claude Code as a coding assistant: scaffolding, writing components and API code, the catalogue import script, documentation and tests, under my direction and review. Claude also powers the store assistant at runtime when an `ANTHROPIC_API_KEY` is configured.

## What was tested

- **Automated:** 60 API tests (`server/tests/`) covering auth, sessions, CSRF, admin authorisation, validation and injection, cart pricing, order isolation, concurrent checkout, uploads, reviews, facets, wishlist lookups, newsletter, headers and rate limiting. All pass.
- **Browser (headless Chrome):** home, shop, product, wishlist, sign in/up, chat, mega menu, search overlay, quick add, bag drawer, checkout and order pages at 1440 px and 390 px; admin overview, products, product editor (with image upload and size presets), categories, orders and reviews; the full guest bag → sign in → merge → checkout → confirmation flow; admin create → edit → delete product flow.
- **Manual API checks** with curl: customer sessions against admin routes, uploads without the CSRF header and with fake image files, client-sent prices being ignored.
- **Not verified:** the Claude-powered assistant path, because no API key was available during development; the rule-based assistant was used for all chat testing. Deployment to Vercel/Render needs the account setup described in the README.
