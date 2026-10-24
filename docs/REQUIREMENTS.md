# Requirements checklist

Every requirement from the assignment brief, and where it is implemented. Paths are relative to the repository root.

## 1. Landing page and website design

| Requirement | Where |
|---|---|
| Custom brand identity, logo, colours, typography | Terrace brand: stepped "terrace" logomark (`client/src/components/layout/Logo.jsx`), tokens in `client/src/styles/tokens.css`, Bricolage Grotesque + Instrument Sans |
| Header with navigation, search, login/signup and cart icons | `components/layout/Header.jsx`: mega menu, category links, search overlay, wishlist, account (sign in / sign up), bag with count |
| Hero with custom headline, imagery and call to action | `components/home/Hero.jsx`: headline, two CTAs, interactive product stage |
| Featured products and categories | Hero product stage (featured products), `CategoryExplorer` in `components/home/HomeSections.jsx` |
| New arrivals, trending or recommended | `ProductTabs`: New in, Bestsellers, Top rated, On sale |
| Promotional banners or offers | `SaleBanner` (live count of reduced items), `EditorialDuo` tiles, announcement bar |
| Footer with useful links and contact information | `components/layout/Footer.jsx`: shop, help and contact columns, address, email, phone, working newsletter form |
| Custom layout, consistent spacing/type/colour, quality imagery, meaningful hover states, responsive | Hand-written CSS Modules on shared tokens; real product photography; hover photo swap, quick add, category explorer; tested at 1440 px and 390 px |

## 2. Customer authentication

| Requirement | Where |
|---|---|
| Registration, login, logout | `server/src/controllers/auth.controller.js`, `client/src/pages/Signup.jsx`, `Login.jsx`, account menu |
| Form validation and useful errors | zod schemas (`server/src/validators/schemas.js`) with field messages; matching client checks and inline errors |
| Secure password storage | bcrypt cost 12 (`server/src/models/User.js`) |
| Session or token auth | JWT in an httpOnly, SameSite cookie (`server/src/middleware/auth.js`) |
| Protected customer and admin routes | Client guards (`components/auth/RouteGuards.jsx`) for UX; server `requireAuth` / `requireRole("admin")` for enforcement |
| Backend authorisation | Role read from the database on each request; 10 admin routes tested for 401/403 (`server/tests/authorization.test.js`) |
| No Firebase | Not used anywhere |

## 3. Product listing and details

| Requirement | Where |
|---|---|
| Products from the database | `GET /api/products` (`server/src/controllers/product.controller.js`) |
| Image, name, price, relevant info | `components/product/ProductCard.jsx` (brand, rating, sale price, badges) |
| Search by name | Header search overlay and `?q=` (name, brand, SKU), regex-escaped |
| Filter by category | Shop sidebar, category chips, nav links (`client/src/pages/Shop.jsx`) |
| Sort by price or other criteria | Featured, newest, bestselling, top rated, price up/down |
| Pagination | Numbered pagination, 12 per page |
| Large images and product info | `components/product/ProductGallery.jsx` (hover zoom, swipe) and `pages/ProductPage.jsx` |
| Name, price, description, category | Product page title block, description, details accordion, breadcrumb |
| Availability or stock | Per-size stock, sold-out sizes crossed out, low-stock messages |
| Add to cart | Product page and quick add on cards (`hooks/useAddToBag.js`) |
| Navigation back to listings | Breadcrumb (Shop → Category → Product), related products |

## 4. Admin dashboard and CRUD

| Requirement | Where |
|---|---|
| Create, read, update, delete products | `client/src/pages/admin/Products.jsx`, `ProductEdit.jsx`; `server/src/controllers/adminProduct.controller.js` |
| Delete with confirmation | `ConfirmDialog` on list and editor |
| Upload images through Cloudinary | `components/admin/ImageUploader.jsx` → `POST /api/admin/uploads` → `services/imageStorage.js` |
| Manage categories | `pages/admin/Categories.jsx` (create, edit, reorder, delete with in-use protection) |
| Search and filter in admin | Products: search, category, live/hidden, low/sold-out stock, sort |
| Fields: name, description, price, category, images, stock, timestamps | Product model; editor shows "Added … , last updated …"; list shows updated date |
| Backend-enforced admin access | Every `/api/admin/*` route behind `requireRole("admin")` |
| Extras | Orders management, review moderation, overview metrics |

## 5. Database and backend

| Requirement | Where |
|---|---|
| Structured, maintainable endpoints | `server/src/routes/index.js` → controllers → services → models |
| Frontend talks to backend via API | `client/src/lib/api.js` + React Query hooks (`client/src/hooks/queries.js`) |
| Data validation | zod on every body, query and params (`middleware/validate.js`) |
| API and database error handling | `middleware/errorHandler.js` (validation, cast, duplicate, payload, DB down → safe messages) |
| Secrets in environment variables | `server/src/config/env.js` validates config; `.env` git-ignored; `.env.example` committed |
| Schema or model | `server/src/models/*`, documented in [DATABASE.md](DATABASE.md) |

## 6. Image upload and management

| Requirement | Where |
|---|---|
| Upload from admin dashboard | Drag and drop or file picker, up to 6 at a time, reorder, cover, alt text |
| Show on cards and detail pages | `ProductCard`, `ProductGallery` |
| Validate type and size | MIME allow-list and 5 MB limit (`middleware/upload.js`), decode check with sharp, minimum 300 × 300 |
| Handle failed uploads and invalid files | Clear per-file messages in the uploader; 400/413/502 from the API |
| Store URLs and metadata | `images[]` with `url`, `publicId`, `width`, `height`, `format`, `bytes`, `alt` |
| Only authorised users can upload | Admin-only route; tested |
| No secrets in frontend | Cloudinary keys only on the server |

## 7. Shopping cart

| Requirement | Where |
|---|---|
| Add, increase/decrease, remove | `context/CartContext.jsx`, `components/cart/CartLine.jsx` |
| Subtotal and total | Calculated by the server (`services/pricing.js`), shown in drawer, bag page and checkout |
| Clear display | Drawer and bag page with images, sizes, free-shipping meter |
| Persistence | Guest bag in localStorage (ids only), account bag in MongoDB, merged at sign in |
| Server validates price and stock | Client prices ignored; stock checked on add, update and checkout; atomic reservation |
| Extras | Cash-on-delivery checkout, order history, status timeline |

## 8. Security

See [SECURITY.md](SECURITY.md) for each measure and the test that proves it: password hashing, validation and sanitising, role-based authorisation, NoSQL and regex injection defences, XSS (React escaping, CSP, plain-text reviews, re-encoded uploads), CSRF header plus SameSite cookies, rate limiting, safe errors, secrets handling.

## 9. Code quality and architecture

| Requirement | Where |
|---|---|
| Reusable React components | `components/ui/*` (Button, Field, Modal/Drawer, Feedback, Controls), product, cart, layout, admin components |
| Organised frontend and backend | Folder structure in the README |
| Routes, controllers, models, middleware, config separated | `server/src/*` |
| Loading, error, empty and success states | Skeletons, `ErrorState` with retry, `EmptyState` with action, toasts |
| Meaningful commits and README | Git history; [README](../README.md) |

## 10–11. AI policy, deployment and submission

| Item | Where |
|---|---|
| AI tools disclosure | [ARCHITECTURE.md](ARCHITECTURE.md#ai-tools-disclosure) |
| README with local setup and deployment | [README](../README.md) |
| Database documentation | [DATABASE.md](DATABASE.md) |
| Technologies and decisions | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Tested confirmation | [ARCHITECTURE.md](ARCHITECTURE.md#what-was-tested) |
| Deployment config | `render.yaml` (API), `client/vercel.json` (storefront) |
| Demo credentials | Created by `npm run seed`; shared privately, not committed |
