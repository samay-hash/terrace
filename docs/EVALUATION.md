# Evaluation summary

This page follows the brief's evaluation criteria (section 12) one by one: what is complete, how to check it in a few minutes, and where it lives in the code. A line-by-line mapping of every requirement is in [REQUIREMENTS.md](REQUIREMENTS.md).

| Evaluation area | Weight | Status |
|---|---|---|
| Custom landing page and UI/UX | 20% | Complete |
| Working features and functionality | 20% | Complete |
| React implementation and code quality | 15% | Complete |
| Backend, APIs and database | 15% | Complete |
| Authentication and security | 15% | Complete, 60 automated tests passing |
| Responsiveness and accessibility | 5% | Complete, checked at 1920, 1440, 1200 and 390 px |
| Deployment, documentation and explanation | 10% | Documentation complete; Cloudinary connected; hosting configured, waiting for a MongoDB Atlas cluster |

---

## 1. Custom landing page and UI/UX (20%)

**Complete.** The store has its own identity (Terrace, a sport and street store from Bengaluru) rather than a template: its own logomark, colour tokens, one typeface (Inter Tight) and hand-written CSS Modules. No UI kit is used.

What a reviewer sees on the home page, top to bottom:

- **Header:** sticky; it turns to frosted glass once the page scrolls. It has a Shop mega menu, category links, search (press `/`), wishlist, account and bag with counts.
- **Hero:** a full-screen photograph of a sunlit study, with a short headline and a single "Shop the edit" button on the curtain.
  - Dotted pointers lead from the watch and the wardrobe to "Order now" links.
  - The watch is one-size, so its link adds it to the bag and opens checkout.
- **This week at Terrace:** a two-row product grid with New in, Bestsellers, Top rated and On sale tabs, and a See more link.
- **Category explorer:** hovering a department swaps the large photo.
- **Watch and eyewear bands:** full-width photos that cross-fade slowly with a gentle zoom and a sweep of warm light. Progress lines can be clicked to jump between photos.
- **Scroll story:** the section holds still while you scroll through three chapters. Each new photo wipes up over the last, and an index below fills as you go (it can be clicked to jump between chapters).
- **Sale panel:** a print-style panel with a halftone pattern and a live count of reduced items.
- **Closing band:** cross-fading photos with two actions, followed by the store's service promises.
- **Footer:** black, with the sale panel's dashed guides and brass halftone, link columns, contact details and a working newsletter form.
- **Framing:** the hero, the photo bands and the story photo sit in rounded frames inset from the screen edges, so every photo has a clean border.

Across the rest of the store, interactions are there to help people decide:

- product cards show a second photo on hover and offer quick add;
- the product page has hover zoom and a size guide that matches the product;
- the product page also shows a delivery estimate with a dispatch countdown, and reviews with a star breakdown.

Motion stops when it is off screen and respects `prefers-reduced-motion`.

**How to check:** open the home page and scroll to the footer. Then open any product, add it to the bag and open the bag drawer.

**Where:**
- [`client/src/components/home/`](../client/src/components/home/)
- [`client/src/styles/tokens.css`](../client/src/styles/tokens.css)
- design notes in [ARCHITECTURE.md](ARCHITECTURE.md#design-notes)

## 2. Working features and functionality (20%)

**Complete.** Every feature in the brief works end to end against the database.

| Feature | Status | How to check |
|---|---|---|
| Sign up, sign in, sign out | Done | `/signup`, then sign out from the account menu |
| Product listing with search, category filter, sort and pagination | Done | `/shop`: type in search, pick a category, change the sort, go to page 2 |
| Product details with images, price, description, category and stock | Done | Any product page; sold-out sizes are crossed out |
| Shopping bag: add, change quantity, remove, totals | Done | Bag drawer and `/cart`; totals come from the server |
| Bag persistence | Done | A guest bag is kept in the browser and merged into the account bag at sign in |
| Checkout and orders | Done | Cash-on-delivery checkout, order confirmation, order history with a status timeline |
| Admin product CRUD with confirmation on delete | Done | `/admin/products` |
| Image upload to Cloudinary from the admin | Done, verified against the live Cloudinary account | Admin → Products → Add product (or edit one) → Images: drag and drop, reorder, set cover, alt text. Files land in the `terrace/products` folder |
| Category management | Done | `/admin/categories` |
| Extras | Done | Order management, review moderation, overview metrics, wishlist, reviews, size guides, a store assistant |

The full flows were run in a headless browser:

- guest bag → sign in → bags merge → checkout → confirmation;
- admin creates a product with an uploaded image → edits it → deletes it.

## 3. React implementation and code quality (15%)

**Complete.**

- **Structure:** React 19 with Vite and React Router. Pages are lazy-loaded, and the admin area is a separate bundle.
- **Server state:** handled by React Query (`hooks/queries.js`). Shared client state (auth, bag, wishlist, toasts) lives in small contexts.
- **Reusable components:** reused across the store and the admin in `components/ui/` (Button, Field, Modal and Drawer, Feedback, Controls).
- **Every data view has four states:** loading (skeletons), empty (with an action), error (with a retry) and success.
- **Heavy pieces load only when needed:** for example, the 3D assistant (three.js) is a separate chunk loaded on demand. Scroll effects write a CSS variable instead of re-rendering React.
- **Code checks:** the code is linted with oxlint (no errors) and builds cleanly.

**Where:**
- [`client/src/`](../client/src/)
- folder structure in the [README](../README.md#project-structure)

## 4. Backend, APIs and database (15%)

**Complete.**

- **Server:** Node.js and Express 5, organised as routes → controllers → services → models, with middleware for auth, validation, sanitising, rate limits and uploads.
- **Database:** MongoDB with Mongoose. The models are User, Category, Product (sizes with stock per size), Review, Cart, Order and Subscriber, with indexes for the catalogue queries.
- **Validation:** every request body, query and set of URL parameters is validated with zod before a handler sees it.
- **Errors:** errors return a code and a message written for people; database and validation failures never leak internals.
- **Prices and stock:** prices are always calculated on the server. Stock is reserved atomically at checkout, so two shoppers cannot buy the last item at once (there is a test for this).
- **Configuration:** settings are validated at start-up; secrets live only in environment variables.

**Where:**
- [`server/src/`](../server/src/)
- every endpoint in [API.md](API.md)
- collections, fields and indexes in [DATABASE.md](DATABASE.md)

## 5. Authentication and security (15%)

**Complete.** Each measure is listed with the test that proves it in [SECURITY.md](SECURITY.md). In short:

- **Passwords:** hashed with bcrypt (cost 12) and never returned. A single generic message covers a wrong email or a wrong password.
- **Sessions:** a JWT in an `httpOnly`, `SameSite` cookie. The frontend never sees or stores the token, and sessions can be revoked.
- **Authorisation on the server:** the role is read from the database on every request. Ten admin routes are tested to return 401 for guests and 403 for customers, and customers can only read their own orders.
- **Injection defences:** NoSQL operator keys are rejected, search text is regex-escaped, and request bodies are size-limited.
- **XSS defences:** React escapes output, a content security policy is set, reviews are stored as plain text, and uploaded images are re-encoded.
- **CSRF defences:** a required custom request header plus SameSite cookies.
- **Rate limits:** applied to sign-in, the assistant, forms and uploads.
- **Upload checks:** type and size are checked, the file is decoded to confirm it is a real image, uploads are admin-only, and Cloudinary keys stay on the server.

**Evidence:** 60 API tests in [`server/tests/`](../server/tests/), all passing (`cd server && npm test`).

## 6. Responsiveness and accessibility (5%)

**Complete.**

- **Responsive layout:** every page is laid out for phones, tablets and desktops, and was checked in a browser at 1920, 1440, 1200 and 390 px.
  - On smaller screens the hero pointers become chips.
  - The navigation moves into a drawer.
  - Grids drop to two columns.
- **Accessibility:**
  - semantic landmarks, a skip link and visible focus rings;
  - labelled form fields with inline errors;
  - focus is trapped in dialogs and drawers;
  - menus, tabs, search, and the size and star pickers all work from the keyboard;
  - alt text on product photos;
  - `aria-live` regions for search results and the assistant;
  - reduced-motion support throughout.

## 7. Deployment, documentation and explanation (10%)

**Documentation: complete.**

| Document | Contents |
|---|---|
| [README](../README.md) | Features, local setup, environment variables, scripts, step-by-step deployment, demo accounts, credits |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Every requirement in the brief and where it is implemented |
| [API.md](API.md) | Every endpoint and who may call it |
| [DATABASE.md](DATABASE.md) | Collections, fields, indexes and relationships |
| [SECURITY.md](SECURITY.md) | Each security measure and its test |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technology choices, key decisions, design notes, AI tools disclosure, what was tested |

**Deployment: configured, not yet live.**

- The storefront deploys to Vercel and the API to Render. Configuration is in [`client/vercel.json`](../client/vercel.json) and [`render.yaml`](../render.yaml).
- Vercel forwards `/api` to Render, so the session cookie stays first-party.
- Cloudinary is connected and the full catalogue's photos are already hosted there. The remaining step is a MongoDB Atlas connection string, then seeding the production database, as described in the README's [Deploy](../README.md#deploy) section.
- The live URLs and demo credentials will be shared with reviewers once that is done.

## Open items

- **Live deployment:** waiting for a MongoDB Atlas connection string (see above).
- **Claude-powered assistant replies:** these were not exercised, because no Anthropic API key was available during development. The rule-based assistant answers from the same live catalogue and was used for all testing. The Claude path switches on when `ANTHROPIC_API_KEY` is set and falls back to the rules on any error.
