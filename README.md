# Terrace — sport and street goods

Terrace is a full-stack e-commerce store built for the Web Developer hiring assignment: trainers, watches, eyewear, bags, clothing and sports gear, with real product photography. It has a custom storefront, email/password accounts, a server-priced bag and checkout, reviews, a wishlist, an admin dashboard with Cloudinary image uploads, and a shopping assistant (a small 3D polar bear) who knows the live catalogue.

| | |
|---|---|
| **Live site** | _add your Vercel URL after deploying_ |
| **API** | _add your Render URL after deploying_ |
| **Stack** | React 19 + Vite, Node.js + Express 5, MongoDB (Mongoose), Cloudinary, optional Claude API |
| **Tests** | 60 API tests (`npm test` in `server/`), all passing |
| **Requirement checklist** | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) maps every point in the brief to the code |

## What's inside

**Storefront**
- **Home:** a full-screen editorial hero (a sunlit study: a short headline and a single "Shop the edit" button on the curtain, with dotted "Order now" pointers to the watch on the desk and the wardrobe; one-size pieces go straight to checkout), a two-row "This week at Terrace" grid with New in / Bestsellers / Top rated / On sale tabs and a See more link, a category explorer, a pinned scroll story (each chapter's photo wipes up over the last while an index fills), a halftone sale panel with live counts, two full-width photo bands and a closing band whose photos cross-fade slowly under a soft sweep of light, and a black footer with dashed guides and a brass halftone, like the sale panel. The hero, the photo bands and the story photo sit in rounded frames inset from the screen edges.
- **Header:** sticky, turning to quiet frosted glass once the page scrolls; Shop mega menu (categories, brands, collections, editor's pick), category links, full-width search overlay with live results (press `/` anywhere), wishlist and bag counts, account menu.
- **Shop:** search by name, brand or SKU; filter by category, men/women, size in stock, brand, price band, rating, sale and stock; sort by featured, newest, bestselling, top rated and price; category chips; 2- or 3-column grid; numbered pagination. All state lives in the URL.
- **Product cards:** hover shows a second photo; quick add (one tap for one-size items, a size row otherwise); wishlist heart; rating; sale and new badges.
- **Product page:** gallery with hover zoom (swipe and dots on phones), brand, rating, price and saving, sizes in the product's own run (UK shoe sizes, XS–XXL, One size) with sold-out sizes crossed out, size guide modal, live stock message, delivery-date estimate with same-day dispatch countdown, details, reviews with star breakdown, sorting and a write-a-review form, related products and recently viewed.
- **Bag, checkout and orders:** slide-in bag and full bag page with quantity changes and a free-shipping meter; cash-on-delivery checkout with address validation; order confirmation, order history and a status timeline.
- **Accounts:** sign up and sign in with inline validation, password rules and safe `?next=` redirects; a wishlist page; help page with shipping, returns, shoe and clothing size charts, care and contact; a 404 page; a working newsletter form in the footer.

**Admin dashboard** (`/admin`, admin role only)
- Overview: 30-day revenue and orders, orders waiting to ship, live products, sold-out count, customers, reviews and newsletter sign-ups, recent orders, low-stock list with sold-out sizes.
- Products: search, filter (category, live/hidden, low/sold-out stock), sort, paginate, toggle live, delete with confirmation.
- Product editor: name, description, price and compare-at price, category, brand, men/women/everyone, SKU, highlights, featured/live flags, a size editor with presets (clothing, men's shoes, women's shoes, one size) and stock per size, and drag-and-drop image upload (reorder, set cover, alt text, remove).
- Categories: create, edit, reorder, delete (blocked while products use it).
- Orders: search by number, filter by status, move through placed → packed → shipped → delivered, or cancel (stock is returned).
- Reviews: search and filter by rating, remove reviews (the product rating is recalculated).

**The Terrace assistant**
- A small 3D polar bear (three.js, loaded only when shown) floating on every store page with no frame around it. It follows the cursor, blinks, thinks while a reply loads and talks when it lands; reduced-motion users get a still pose and browsers without WebGL a flat illustration.
- Answers questions about products, stock by size, sizing, delivery, returns, payment and, when signed in, the shopper's bag and latest order. It also knows which page you're on and what's in your wishlist. Recommends products as tappable cards and offers follow-up chips. Replies in Hinglish if you write in Hinglish.
- With `ANTHROPIC_API_KEY` set, replies come from Claude (model set by `CHAT_MODEL`) using the live catalogue and store policies as context, with structured JSON output. Without a key, or if the call fails, a rule-based engine answers from the same live data, so the assistant always works.

## Project structure

```
client/                      React app (Vite)
  src/components/            ui/ layout/ product/ cart/ home/ chat/ auth/ admin/
  src/context/               Auth, Cart (guest + server bag), Wishlist, Toast
  src/hooks/                 React Query data hooks, recently viewed, small utilities
  src/pages/                 Store pages and pages/admin/
  public/images/editorial/   Editorial photos (960 and 1920 px WebP)
  vercel.json                SPA fallback, /api rewrite to Render, security headers
server/                      Express API
  src/config/                env validation (zod), MongoDB connection
  src/models/                User, Category, Product, Review, Cart, Order, Subscriber
  src/middleware/            auth, CSRF header, validation, sanitising, rate limits, uploads, errors
  src/controllers/           route handlers per resource
  src/services/              pricing, catalogue queries, reviews, image storage, chat/
  src/validators/schemas.js  every request schema in one place
  src/routes/index.js        all routes; admin routes grouped behind requireRole("admin")
  seed/                      fetchCatalog.js, data/catalog.json, images/, seed.js
  tests/                     node:test + supertest suites
docs/                        REQUIREMENTS.md, DATABASE.md, API.md, SECURITY.md, ARCHITECTURE.md
render.yaml                  Render blueprint for the API
```

## Run it locally

Requirements: Node.js 22.9 or newer and MongoDB (local `mongod` or a free Atlas cluster). Cloudinary and an Anthropic key are optional for local work.

```bash
# 1. API
cd server
cp .env.example .env          # then set JWT_SECRET and the SEED_* passwords
npm install
npm run seed                  # 6 categories, 52 products with photos, 156 reviews, demo accounts, sample orders
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
| server | `npm run seed` | Adds anything missing; `npm run seed -- --reset` wipes catalogue, reviews, carts and orders first |
| server | `npm test` | Runs the test suite against `MONGODB_URI_TEST` (default `mongodb://127.0.0.1:27017/terrace_test`, dropped after each file) |
| server | `npm run fetch-catalog` | Re-downloads the catalogue and photos from DummyJSON into `seed/` |
| client | `npm run dev` / `npm run build` | Dev server / production build |

## Deploy

The storefront runs on **Vercel**, the API on **Render**, data on **MongoDB Atlas**, images on **Cloudinary**. Vercel rewrites `/api/*` to Render, so the session cookie is first-party and `SameSite=Lax` works without third-party cookies.

1. **MongoDB Atlas:** create a free cluster and a database user, allow access from anywhere (`0.0.0.0/0`; Render's free plan has no fixed IP), and copy the connection string with `/terrace` as the database name.
2. **Cloudinary:** copy the cloud name, API key and API secret from the dashboard.
3. **Render:** New → Blueprint → pick this repo (`render.yaml`). Fill in `MONGODB_URI`, `CLIENT_ORIGIN` (your Vercel URL, e.g. `https://terrace.vercel.app`), the Cloudinary keys and optionally `ANTHROPIC_API_KEY`. `JWT_SECRET` is generated for you.
4. **Seed production once** from your machine, with the production values in a file such as `server/.env.production` (git-ignored): `cd server && node --env-file=.env.production seed/seed.js`. The seed uploads every product photo to Cloudinary.
5. **Vercel:** import the repo, set the root directory to `client` (framework: Vite). Edit `client/vercel.json` so the `/api/:path*` rewrite points to your Render URL, then deploy.
6. Open the Vercel URL, sign in as the admin and check the dashboard.

## Demo accounts

`npm run seed` creates the accounts from `SEED_*` in `server/.env`. For the hosted demo, the admin credentials are shared privately with reviewers, as the brief asks; they are not in this repository.

- **Customer:** the `SEED_CUSTOMER_EMAIL` account has three sample orders (delivered, shipped, placed).
- **Admin:** the `SEED_ADMIN_EMAIL` account lands on `/admin` after signing in.

## Documentation

- [docs/EVALUATION.md](docs/EVALUATION.md): the brief's evaluation criteria, what is complete for each and how to check it
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): every requirement in the brief and where it is implemented
- [docs/DATABASE.md](docs/DATABASE.md): collections, fields, indexes and relationships
- [docs/API.md](docs/API.md): every endpoint with auth requirements
- [docs/SECURITY.md](docs/SECURITY.md): each security measure and the test that proves it
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): technology choices, key decisions, design notes, AI tools disclosure and what was tested

## Data and image credits

- **Products, photos and seed reviews:** [DummyJSON](https://dummyjson.com), an open-source mock-data API. Placeholder brand names were mapped to a few house labels (Terrace Studio, Fieldcraft, Vera Nolan, Haldane & Co., Solstice Optics, Arlo & Pine); prices were converted to rupees.
- **Editorial photos** (photo bands, scroll story, category explorer): Wikimedia Commons, all CC0 (Unsplash uploads). The hero image and the sign-in photo were supplied by the project owner. Each is credited on the Help page (`/help#credits`) and listed in `client/src/lib/photos.js`.
- **Font:** Inter Tight (SIL Open Font License), served by Google Fonts.
- This is a demo store: nothing is shipped or charged.
