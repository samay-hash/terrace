# API reference

Base path `/api`. JSON in and out. Every request schema lives in `server/src/validators/schemas.js`.

**Conventions**
- Sessions use the `terrace_session` httpOnly cookie, set by sign in and registration.
- Every `POST`, `PUT`, `PATCH` and `DELETE` must send `X-Requested-With: terrace` (CSRF defence). Requests without it get 403.
- Errors look like `{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields need attention.", "details": { "fields": { "email": "Enter a valid email address." } } } }`.
- Status codes: 400 invalid input, 401 not signed in, 403 signed in without permission (or missing CSRF header), 404 not found, 409 conflict (stock, duplicates, state changes), 413 too large, 429 rate limited, 502/503 upstream or database unavailable.

Access: **Public** anyone, **User** any signed-in account, **Admin** role `admin` (checked against the database on every request).

## Auth

| Method | Path | Access | Body / notes |
|---|---|---|---|
| POST | `/auth/register` | Public, rate limited | `{ name, email, password }`. Password 8+ chars with a letter and a number. Always creates a customer. |
| POST | `/auth/login` | Public, rate limited | `{ email, password }`. 401 with one generic message for any failure. |
| POST | `/auth/logout` | Public | Clears the cookie. 204. |
| GET | `/auth/me` | Public | `{ user }` or `{ user: null }`. |

## Catalogue

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | Public | Categories with live product counts. |
| GET | `/products` | Public | Query: `q`, `category` (slug), `size`, `kitType`, `minPrice`, `maxPrice`, `onSale`, `inStock`, `featured`, `sort` (`featured`, `newest`, `price-asc`, `price-desc`, `popular`, `name`), `page`, `limit` (≤ 48). Returns `{ items, pagination }`. |
| GET | `/products/facets` | Public | Price range of live products. |
| GET | `/products/:slug` | Public | `{ product, related }`. 404 for hidden products. |

## Bag

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/cart/quote` | Public | `{ items: [{ productId, size, quantity }] }`. Prices a guest bag; stores nothing. |
| GET | `/cart` | User | Priced bag: `{ items, summary }`. Each line has `unitPrice`, `lineTotal`, `available` and an `issue` (`unavailable`, `size`, `out_of_stock`, `limited`) when it can't be bought as is. |
| POST | `/cart/items` | User | `{ productId, size, quantity }`. Any price fields are ignored. 409 if stock is short. |
| PATCH | `/cart/items/:itemId` | User | `{ quantity }` |
| DELETE | `/cart/items/:itemId` | User | |
| DELETE | `/cart` | User | Empties the bag. |
| POST | `/cart/merge` | User | Guest lines to fold in after sign in; quantities are capped, not rejected. |

## Orders

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/orders` | User | `{ shippingAddress, paymentMethod: "cod" }`. Re-prices the bag, reserves stock atomically per line, creates the order and empties the bag. 409 `CART_CHANGED` or `OUT_OF_STOCK` if anything moved. |
| GET | `/orders` | User | Your last 50 orders. |
| GET | `/orders/:id` | User | Your order (admins can read any). Other people's orders return 404. |

## Assistant

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/chat` | Public, 15/min | `{ messages: [{ role: "user" \| "assistant", content }], productSlug? }`, last message from the user, ≤ 20 turns. Returns `{ reply, products, suggestions, source: "model" \| "rules" }`. Uses the session (if any) for bag and order context. |

## Admin (all require Admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/overview` | Counts, 30-day revenue and orders, low stock, recent orders. |
| GET | `/admin/products` | Same filters as `/products` plus `status` (`all`, `active`, `draft`) and `stock` (`all`, `low`, `out`); includes hidden products. |
| POST | `/admin/products` | Create. Body: `name, description, price, compareAtPrice?, category, team?, season?, kitType, details[], images[], sizes[], sku?, isFeatured, isActive`. |
| GET | `/admin/products/:id` | |
| PUT | `/admin/products/:id` | Full update. Images removed from the product are deleted from Cloudinary after the save succeeds. |
| PATCH | `/admin/products/:id` | `{ isActive?, isFeatured? }` quick toggles. |
| DELETE | `/admin/products/:id` | Deletes the product and its images. |
| POST | `/admin/uploads` | `multipart/form-data`, field `images`, up to 6 files, 5 MB each, JPG/PNG/WebP/AVIF, at least 300×300. Returns `{ images: [{ url, publicId, width, height, format, bytes }] }`. |
| GET | `/admin/categories` | With counts including hidden products. |
| POST | `/admin/categories` | `{ name, description?, sortOrder }` |
| PUT | `/admin/categories/:id` | |
| DELETE | `/admin/categories/:id` | 409 while products use it. |
| GET | `/admin/orders` | Query: `status`, `q` (order number), `page`, `limit`. |
| PATCH | `/admin/orders/:id/status` | `{ status }`. Only valid transitions are accepted; cancelling restocks. |

## Health

`GET /api/health` returns `{ ok: true }` (used by Render's health check).
