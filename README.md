# Terrace — kit for the stands

Terrace is a full-stack e-commerce store for football, cricket and basketball shirts, built for the Web Developer hiring assignment. It has a custom storefront, email/password accounts, a server-priced bag and checkout, an admin dashboard with Cloudinary image uploads, and **Chotu**, a small, permanently grumpy shopping assistant who knows the live catalogue.

| | |
|---|---|
| **Live site** | _add your Vercel URL after deploying_ |
| **API** | _add your Render URL after deploying_ |
| **Stack** | React 19 + Vite, Node.js + Express 5, MongoDB (Mongoose), Cloudinary, optional Claude API |
| **Tests** | 50 API tests (`npm test` in `server/`), all passing |

## What's inside

**Storefront**
- Home page: "Kit of the week" tactics board (live featured product with quick add), category rail, Bestsellers / New in / On sale tabs, Floodlight sale banner, Retro room (pick a year), Chotu teaser.
- Shop: search by name, team or SKU (with live suggestions in the header), filter by category, size in stock, price band, kit type, sale and stock; sort by featured, bestselling, newest and price; numbered pagination. All state lives in the URL.
- Product page: gallery (front, back and close-up), size picker that shows sold-out sizes, per-size stock messages, quantity, accordion with description, size guide, delivery and returns, related shirts.
- Bag: slide-in drawer and full page, quantity changes, remove, free-shipping meter, subtotal/shipping/total from the server, clear messages when stock changes.
- Checkout (cash on delivery) with address validation, order confirmation, order history and a status timeline.
- Sign in / sign up with inline validation, password rules, show/hide password and safe `?next=` redirects.
- Help page (shipping, returns, size chart, care, contact) and a 404 page.

**Admin dashboard** (`/admin`, admin role only)
- Overview: 30-day revenue and orders, orders waiting to ship, live products, sold-out count, customers, recent orders, low-stock list.
- Products: search, filter (category, live/hidden, low/sold-out stock), sort, paginate, toggle live, delete with confirmation.
- Product editor: name, description, price and compare-at price, category, kit type, team, season, SKU, highlights, featured/live flags, stock per size, and drag-and-drop image upload (reorder, set cover, alt text, remove).
- Categories: create, edit, reorder, delete (blocked while products still use it).
- Orders: search by number, filter by status, move through placed → packed → shipped → delivered, or cancel (stock is returned).

**Chotu, the assistant**
- Floating on every store page. Answers questions about products, stock by size, sizing, delivery, returns, payment and (when signed in) the shopper's bag and latest order. Recommends shirts as tappable cards and offers follow-up chips.
- With `ANTHROPIC_API_KEY` set, replies come from Claude (model set by `CHAT_MODEL`) using the live catalogue and store policies as context, with structured JSON output. Without a key, or if the model call fails, a rule-based engine answers from the same live data, so the assistant always works.

## Project structure

```
client/                      React app (Vite)
  src/components/            ui/ layout/ product/ cart/ home/ chat/ auth/ admin/
  src/context/               Auth, Cart (guest + server bag), Toast
  src/hooks/                 React Query data hooks, small utilities
  src/pages/                 Store pages and pages/admin/
  vercel.json                SPA fallback, /api rewrite to Render, security headers
server/                      Express API
  src/config/                env validation (zod), MongoDB connection
  src/models/                User, Category, Product, Cart, Order
  src/middleware/            auth, CSRF header, validation, sanitising, rate limits, uploads, errors
  src/controllers/           route handlers per resource
  src/services/              pricing, catalogue queries, image storage, chat/
  src/validators/schemas.js  every request schema in one place
  src/routes/index.js        all routes, admin routes grouped behind requireRole("admin")
  seed/                      demo catalogue, jersey renderer, seed script
  tests/                     node:test + supertest suites
docs/                        DATABASE.md, API.md, SECURITY.md, ARCHITECTURE.md
render.yaml                  Render blueprint for the API
```

## Run it locally

Requirements: Node.js 22.9 or newer, and MongoDB (local `mongod` or a free Atlas cluster). Cloudinary and an Anthropic key are optional for local work.

```bash
# 1. API
cd server
cp .env.example .env          # then set JWT_SECRET and the SEED_* passwords
npm install
npm run seed                  # 6 categories, 36 products with images, demo accounts, sample orders
npm run dev                   # http://localhost:4000

# 2. Storefront (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the API, so the browser talks to one origin, exactly as in production.

Without Cloudinary credentials the API stores uploads on local disk in `server/uploads/`. This fallback is development-only: in production the upload endpoint answers 503 until Cloudinary is configured.

### Environment variables (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | 32+ random characters for signing sessions |
| `CLIENT_ORIGIN` | yes | Storefront origin(s) allowed by CORS, comma-separated |
| `TRUST_PROXY` | prod | Number of proxies in front of the API (2 for Vercel → Render) |
| `COOKIE_SAMESITE` | no | `lax` (default, same-site proxy) or `none` for a cross-site setup |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | prod | Image hosting |
| `CLOUDINARY_FOLDER` | no | Upload folder, default `terrace/products` |
| `ANTHROPIC_API_KEY` | no | Enables the Claude-powered assistant |
| `CHAT_MODEL` | no | Defaults to `claude-opus-5-5` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed | Demo admin created by `npm run seed` |
| `SEED_CUSTOMER_EMAIL` / `SEED_CUSTOMER_PASSWORD` | seed | Demo customer |

The config is validated with zod at boot; a missing or weak value stops the server with a readable message.

### Scripts

| Where | Command | What it does |
|---|---|---|
| server | `npm run dev` | API with file watching |
| server | `npm run seed` | Adds anything missing; `npm run seed -- --reset` wipes catalogue, carts and orders first |
| server | `npm test` | Runs the test suite against `MONGODB_URI_TEST` (default `mongodb://127.0.0.1:27017/terrace_test`, dropped after each file) |
| server | `npm run render-images -- --sheet` | Re-renders the seed product photos and a contact sheet |
| client | `npm run dev` / `npm run build` | Dev server / production build |

## Deploy

The storefront runs on **Vercel**, the API on **Render**, data on **MongoDB Atlas**, images on **Cloudinary**. Vercel rewrites `/api/*` to Render, so the session cookie is first-party and `SameSite=Lax` works without third-party cookies.

1. **MongoDB Atlas**: create a free cluster and a database user, allow access from anywhere (`0.0.0.0/0`, Render has no fixed IP on the free plan), copy the connection string with `/terrace` as the database name.
2. **Cloudinary**: copy the cloud name, API key and API secret from the dashboard.
3. **Render**: New → Blueprint → pick this repo (`render.yaml`). Fill in `MONGODB_URI`, `CLIENT_ORIGIN` (your Vercel URL, e.g. `https://terrace.vercel.app`), the Cloudinary keys and optionally `ANTHROPIC_API_KEY`. `JWT_SECRET` is generated for you.
4. **Seed production once** from your machine: `cd server && MONGODB_URI="<atlas uri>" CLOUDINARY_CLOUD_NAME=… CLOUDINARY_API_KEY=… CLOUDINARY_API_SECRET=… JWT_SECRET=<any 32+ chars> SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… SEED_CUSTOMER_EMAIL=… SEED_CUSTOMER_PASSWORD=… node seed/seed.js`. The seed uploads all product photos to Cloudinary.
5. **Vercel**: import the repo, set the root directory to `client` (framework: Vite). Edit `client/vercel.json` so the `/api/:path*` rewrite points to your Render URL, then deploy.
6. Open the Vercel URL, sign in as the admin and check the dashboard.

## Demo accounts

`npm run seed` creates the accounts from `SEED_*` in `server/.env`. For the hosted demo, the admin credentials are shared privately with reviewers, as the brief asks; they are not in this repository.

- Customer: the `SEED_CUSTOMER_EMAIL` account has three sample orders (delivered, shipped, placed).
- Admin: the `SEED_ADMIN_EMAIL` account lands on `/admin` after signing in.

## Documentation

- [docs/DATABASE.md](docs/DATABASE.md): collections, fields, indexes and relationships
- [docs/API.md](docs/API.md): every endpoint with auth requirements
- [docs/SECURITY.md](docs/SECURITY.md): each security measure and the test that proves it
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): technology choices, key decisions, AI tools disclosure and what was tested

## Product images and content

Every club, sponsor and player name is fictional, and national-team shirts use colours only (no federation badges). The 108 product photos are rendered by `server/seed/jersey.js` from each kit's colours and pattern, so the catalogue is consistent and licence-free. The floodlit pitch photo on the sign-in pages and sale banner is a public-domain (CC0) image from rawpixel/Wikimedia. Fonts are Big Shoulders Display and Instrument Sans (SIL Open Font License).
