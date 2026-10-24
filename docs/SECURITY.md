# Security

Each measure below names where it lives in the code and the automated test that checks it. Run the tests with `cd server && npm test` (60 tests; they need a MongoDB instance).

## Passwords and accounts

| Measure | Where | Tested by |
|---|---|---|
| Passwords hashed with bcrypt, cost 12; plaintext never stored or logged | `models/User.js` | `auth.test.js` "creates a customer, hashes the password…" |
| Hash excluded from queries (`select: false`) and from JSON output | `models/User.js` | same test checks the response |
| Password rules: 8–128 characters with a letter and a number (server and client) | `validators/schemas.js`, `pages/Signup.jsx` | "rejects weak passwords and invalid emails" |
| One message for wrong email and wrong password; a dummy bcrypt compare keeps timing similar | `controllers/auth.controller.js` | "uses one generic message…" |
| Registration ignores any `role` field: unknown keys are stripped and the role is hard-coded to customer | `schemas.js`, `auth.controller.js` | "ignores a role sent by the client" |
| Brute-force limit: 10 failed sign-ins per 15 minutes per IP + email | `middleware/rateLimit.js` | `rate-limit.test.js` |

## Sessions

| Measure | Where | Tested by |
|---|---|---|
| JWT (HS256, 7 days) in an `httpOnly` cookie, so page scripts (and any XSS) can't read it; `Secure` in production; `SameSite=Lax` | `middleware/auth.js` | "…sets an httpOnly session cookie" |
| Only HS256 is accepted (`alg: none` and forged signatures are rejected) | `middleware/auth.js` | "rejects the 'none' algorithm", "treats a token signed with another secret as signed out" |
| Role is loaded from the database on every request, never trusted from the token | `middleware/auth.js` | "loses admin access as soon as the role is removed" |
| `tokenVersion` in the token allows revoking every session for a user | `middleware/auth.js` | "invalidates existing sessions when tokenVersion is bumped" |
| The frontend never stores tokens; it only knows "signed in as …" from `/auth/me` | `context/AuthContext.jsx` | — |

## Authorisation

| Measure | Where | Tested by |
|---|---|---|
| Every admin route sits behind `requireRole("admin")` on the server; React route guards are only for UX | `routes/index.js` | `authorization.test.js` checks 10 admin routes return 401 for guests and 403 for customers |
| Customers can only read their own orders (others get 404, not 403, so ids can't be probed) | `controllers/order.controller.js` | "does not let one customer read another customer's order" |
| Hidden products are invisible to shoppers | `controllers/product.controller.js` | "hides unpublished products from shoppers but not from admins" |

## Input validation and injection

| Measure | Where | Tested by |
|---|---|---|
| Every body, query and params object is parsed by a zod schema; handlers only read the parsed result | `middleware/validate.js`, `validators/schemas.js` | many, e.g. "validates product input" |
| NoSQL operator injection: values must be primitives, and any key containing `$` or `.` (body or query) is rejected; the query parser doesn't build nested objects | `middleware/sanitize.js`, `app.js` | "blocks NoSQL operator injection in the login body", "rejects bodies with operator keys", "does not turn bracketed query keys into Mongo operators" |
| Search text and the brand filter are regex-escaped before use, so `(.*)+$` or `.*` is matched literally (no ReDoS, no pattern injection) | `utils/text.js`, `services/catalog.js` | "treats regex characters in search as plain text", "filters by brand without treating the value as a pattern" |
| Slug lists for the wishlist are validated against a strict pattern and capped at 50 | `schemas.js` | "returns products by slug and rejects malformed slugs" |
| Text fields are trimmed and stripped of control characters; lengths are capped | `utils/text.js`, `schemas.js` | — |
| JSON bodies limited to 100 KB; malformed JSON returns a clean 400 | `app.js`, `middleware/errorHandler.js` | "returns a clean 400 for malformed JSON and oversized bodies" |
| Product images must come from our own upload endpoint (no hotlinking or tracking pixels) | `controllers/adminProduct.controller.js` | "refuses image URLs that did not come from our upload endpoint" |

## User-generated content (reviews)

| Measure | Where | Tested by |
|---|---|---|
| Only signed-in customers can post; one review per customer per product (unique index plus a check) | `controllers/review.controller.js`, `models/Review.js` | `reviews.test.js` "requires a signed-in customer to post", "allows one review per customer per product" |
| Rating, title and body validated and length-capped; control characters stripped | `validators/schemas.js` | "validates the rating and body" |
| Markup such as `<img onerror>` is stored and returned as plain text and rendered by React as text | `Review.js`, `components/product/Reviews.jsx` | "stores markup as plain text and updates the product rating" |
| The author's name comes from the session; any `userId` in the body is ignored; the user id is never exposed | `review.controller.js` | same test |
| Moderation (delete) is admin-only and recalculates the product rating | `routes/index.js` | "lets only admins moderate reviews" |
| Posting reviews and newsletter sign-ups are rate limited (20 per 10 minutes per IP) | `middleware/rateLimit.js` | — |
| Newsletter answers identically for new and existing emails, so it can't be used to check who subscribed | `controllers/newsletter.controller.js` | "validates the email and answers the same way for repeat sign-ups" |

## Cross-site scripting

- React escapes all rendered text, and the app never uses `dangerouslySetInnerHTML`. Product descriptions are rendered as plain paragraphs.
- The API serves only JSON with `Content-Security-Policy: default-src 'none'` and `X-Content-Type-Options: nosniff` (helmet). Tested by "sets helmet headers and hides the framework".
- The storefront is served by Vercel with a strict CSP (`script-src 'self'`, images only from self and Cloudinary, `frame-ancestors 'none'`), `X-Frame-Options: DENY` and a referrer policy (`client/vercel.json`).
- SVG uploads are refused, and every upload is re-encoded, so no file with embedded script ever reaches storage.

## Cross-site request forgery

- The cookie is `SameSite=Lax`, so it isn't sent on cross-site POSTs.
- Additionally, every state-changing request must carry `X-Requested-With: terrace`. A browser can't add that header to a cross-site request without a CORS preflight, and CORS only allows the storefront origin with credentials. Tested by "refuses state-changing requests without the client header" and "only allows the storefront origin to make credentialed calls".

## Payments and stock (business logic)

| Measure | Where | Tested by |
|---|---|---|
| The client sends only product id, size and quantity. Prices, totals and shipping are always computed from the database | `services/pricing.js` | "ignores any price the client sends…" |
| Quantities are checked against per-size stock when adding, updating and at checkout | `controllers/cart.controller.js` | "refuses quantities above stock" |
| Stock is reserved with a single conditional atomic update per line (`stock >= qty` and decrement together); if any line fails, earlier reservations are released | `controllers/order.controller.js` | "sells the last unit only once when two shoppers check out together" |
| Order status changes follow an allowed transition table; cancelling restocks | `controllers/order.controller.js` | — |

## Image uploads

| Measure | Where | Tested by |
|---|---|---|
| Admin-only route with its own rate limit | `routes/index.js` | authorization suite |
| MIME allow-list (JPG, PNG, WebP, AVIF), 5 MB per file, 6 files per request | `middleware/upload.js` | "rejects SVG…", "rejects files over 5 MB with 413" |
| The bytes are decoded with sharp to prove they are an image, then re-encoded to WebP (strips EXIF such as GPS) and resized to ≤ 2000 px | `services/imageStorage.js` | "rejects a non-image disguised with an image MIME type", "re-encodes a real image to WebP" |
| Minimum 300×300 so listings never show tiny images | `services/imageStorage.js` | "rejects images that are too small to use" |
| Cloudinary credentials stay on the server; the browser only ever sends files to our API | `services/imageStorage.js` | — |
| Failed uploads report a clear message; storage is cleaned up after product deletes and edits | `imageStorage.js`, `adminProduct.controller.js` | — |

## Secrets, errors and transport

- All configuration comes from environment variables, validated at boot (`config/env.js`). `.env` files are git-ignored; only `.env.example` files with placeholders are committed. Render secrets are `sync: false` in `render.yaml`, and `JWT_SECRET` is generated by Render.
- Errors return safe messages with a code. Stack traces and driver errors are logged server-side only, and production 500s say "Something went wrong on our side." Tested by "answers unknown routes with JSON and no stack trace".
- `x-powered-by` is disabled; helmet sets HSTS and the other standard headers.
- `trust proxy` is configured so rate limits and secure cookies see the real client IP behind Vercel and Render.
- Open redirects are blocked: `?next=` after sign in only accepts same-site paths (`client/src/lib/navigation.js`).

## The assistant

- The chat endpoint is public but rate limited (15 requests per minute per IP), message count and length are capped, and the last message must come from the user.
- The model is told to answer only from the store facts and catalogue it is given, and to ignore instructions inside messages. Only product slugs that exist in the live catalogue become cards.
- Signed-in shoppers' context (first name, bag, last three orders) is added server-side from their own session only.

## Manual checks done

Besides the automated suite, these were checked by hand against the running app: customer session calling `/api/admin/*` with curl (403), upload without the CSRF header (403), upload of `/etc/hosts` renamed as PNG (400), guest checkout redirecting to sign in with `?next=/checkout`, and the full guest-bag → sign-in → merge → checkout → order page flow in a headless browser.
