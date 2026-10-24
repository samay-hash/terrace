# Database schema

MongoDB with Mongoose models in `server/src/models/`. All collections have `createdAt` and `updatedAt` timestamps. Prices are stored as whole rupees (integers).

```
User 1 ──── 1 Cart ──── * CartItem ──── 1 Product * ──── 1 Category
  │                                        ▲  ▲
  ├──── * Order ──── * OrderItem (snapshot) ┘  │ (reference kept for linking only)
  └──── * Review ──────────────────────────────┘
Subscriber (newsletter, standalone)
```

## users

| Field | Type | Notes |
|---|---|---|
| `name` | String, required, ≤ 80 | |
| `email` | String, required, unique, lowercase | |
| `passwordHash` | String, required, `select: false` | bcrypt, cost 12. Never returned by queries unless explicitly selected; stripped from JSON. |
| `role` | `"customer"` \| `"admin"`, indexed | Defaults to customer. Only the seed script or a database operator can create admins. |
| `tokenVersion` | Number, `select: false` | Embedded in the session token. Incrementing it signs the user out everywhere. |
| `lastLoginAt` | Date | |

## categories

| Field | Type | Notes |
|---|---|---|
| `name` | String, required, ≤ 60 | |
| `slug` | String, required, unique | Generated from the name; used in URLs (`/shop?category=retro`). |
| `description` | String, ≤ 280 | Shown at the top of the category page. |
| `sortOrder` | Number | Navigation order, lowest first. |

A category cannot be deleted while any product references it (409).

## products

| Field | Type | Notes |
|---|---|---|
| `name` | String, required, ≤ 120 | |
| `slug` | String, required, unique | From the name; numbered on collision (`-2`, `-3`). |
| `description` | String, required, 20–4000 | Paragraphs separated by blank lines. |
| `price` | Number, required, ≥ 0 | The only price the server ever charges. |
| `compareAtPrice` | Number, optional | Shown struck through when higher than `price` ("on sale"). |
| `category` | ObjectId → categories, required, indexed | |
| `brand` | String, indexed | e.g. "Puma", "Haldane & Co."; filterable and searchable. |
| `gender` | `men` \| `women` \| `unisex`, indexed | The men/women filters also include unisex products. |
| `details` | [String], ≤ 8 | Highlight bullets. |
| `images` | [Image] | See below. First image is the cover. |
| `sizes` | [{ `label`: String, `stock`: Number ≥ 0 }], 1–12 | Free-text labels in display order: "XS"–"XXL", "UK 7", "One size". Validated against `/^[A-Za-z0-9][A-Za-z0-9 ./-]{0,15}$/`. A size that isn't listed isn't made; stock 0 means sold out. |
| `stock` | Number, indexed | Sum of size stock, recalculated on every save and changed atomically with size stock at checkout. Used for filtering and sorting. |
| `sku` | String, uppercase | |
| `isFeatured` | Boolean, indexed | Eligible for "Kit of the week". |
| `isActive` | Boolean, indexed | Hidden products return 404 to shoppers. |
| `salesCount` | Number | Incremented at checkout; drives "Bestselling". |
| `rating`, `reviewCount` | Number | Average (one decimal) and count, recalculated whenever a review is added or removed, so listings can sort and filter by rating cheaply. |

**Image** (embedded): `url`, `publicId` (Cloudinary id, used to delete the file), `width`, `height`, `format`, `bytes`, `alt`.

**Indexes**: `slug` (unique), `category`, `brand`, `gender`, `stock`, `isFeatured`, `isActive`, and compound `{isActive, price}`, `{isActive, createdAt}`, `{isActive, salesCount}`, `{isActive, rating}` for the shop's sort orders.

## reviews

| Field | Type | Notes |
|---|---|---|
| `product` | ObjectId → products, indexed | |
| `user` | ObjectId → users, optional | Empty for reviews imported with the seed catalogue. Never returned by the public API. |
| `authorName` | String, ≤ 80 | Taken from the signed-in user's account, not from the request. The store shows the first name only. |
| `rating` | Number 1–5 | |
| `title` | String, ≤ 80 | Optional headline. |
| `body` | String, 10–1000 | Plain text; rendered as text, never HTML. |
| `verified` | Boolean | True when the author has a non-cancelled order containing the product. |

**Indexes**: unique `{product, user}` (partial, only where `user` exists) so each customer reviews a product once; `createdAt`.

## subscribers

| Field | Type | Notes |
|---|---|---|
| `email` | String, unique, lowercase | Upserted, so signing up twice is harmless. |

## carts

One per signed-in user. Guests keep `{productId, size, quantity}` in localStorage and the server prices it through `POST /api/cart/quote`; it is merged into this collection at sign in.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → users, unique | |
| `items` | [{ `_id`, `product` → products, `size` (label), `quantity` 1–10 }], ≤ 30 lines | No prices are stored: every read re-prices the bag from `products`. |

## orders

| Field | Type | Notes |
|---|---|---|
| `orderNumber` | String, unique | `TRC-YYMMDD-XXXXXX` |
| `user` | ObjectId → users, indexed | |
| `items` | [OrderItem] | Snapshot at purchase time: `product` (reference), `name`, `slug`, `image`, `size`, `unitPrice`, `quantity`, `lineTotal`. Editing or deleting the product later doesn't change the order. |
| `subtotal`, `shippingFee`, `total` | Number | Calculated on the server. Shipping is free from ₹2,999, otherwise ₹99. |
| `shippingAddress` | { `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `postalCode` } | |
| `paymentMethod` | `"cod"` | |
| `status` | `placed` → `packed` → `shipped` → `delivered`, or `cancelled` from placed/packed | Cancelling returns the stock. |

**Indexes**: `orderNumber` (unique), `user`, `status`, `createdAt`.
