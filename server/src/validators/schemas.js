import { z } from "zod";
import { objectId } from "../middleware/validate.js";
import { KIT_TYPES, SIZES } from "../models/Product.js";
import { ORDER_STATUSES } from "../models/Order.js";
import { MAX_QTY_PER_LINE, MAX_CART_LINES } from "../models/Cart.js";
import { cleanMultiline, cleanText } from "../utils/text.js";

const text = (min, max, label) =>
  z
    .string({ error: `${label} is required.` })
    .transform(cleanText)
    .pipe(z.string().min(min, `${label} must be at least ${min} characters.`).max(max, `${label} must be ${max} characters or fewer.`));

const optionalText = (max, label) =>
  z.string().transform(cleanText).pipe(z.string().max(max, `${label} must be ${max} characters or fewer.`)).optional();

const email = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254));

// ---------- Auth ----------

// Unknown keys (for example "role") are stripped, so nobody can register as admin.
export const registerSchema = z.object({
  name: text(2, 80, "Name"),
  email,
  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be 128 characters or fewer.")
    .regex(/[A-Za-z]/, "Password must include a letter.")
    .regex(/\d/, "Password must include a number."),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required." }).min(1, "Password is required.").max(128),
});

// ---------- Catalogue ----------

const sortValues = ["featured", "newest", "price-asc", "price-desc", "popular", "name"];

const boolFlag = z.enum(["true", "false"]).transform((v) => v === "true");

export const productListQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().toLowerCase().max(60).optional(),
  size: z.enum(SIZES).optional(),
  kitType: z.enum(KIT_TYPES).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  onSale: boolFlag.optional(),
  inStock: boolFlag.optional(),
  featured: boolFlag.optional(),
  sort: z.enum(sortValues).default("featured"),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const adminProductListQuery = productListQuery.extend({
  sort: z.enum([...sortValues, "stock-asc", "updated"]).default("updated"),
  status: z.enum(["all", "active", "draft"]).default("all"),
  stock: z.enum(["all", "low", "out"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const slugParam = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/, "Invalid product") });
export const idParam = z.object({ id: objectId });

const imageInput = z.object({
  // Either an https URL from the image host or a local dev upload path.
  url: z
    .string()
    .max(500)
    .refine((v) => /^https:\/\/[^\s"'<>]+$/.test(v) || /^\/uploads\/[a-z0-9-]+\.webp$/.test(v), "Image URL is not valid."),
  publicId: z.string().min(1).max(200),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().max(10).optional(),
  bytes: z.number().int().positive().optional(),
  alt: optionalText(140, "Alt text"),
});

const sizeInput = z.object({
  label: z.enum(SIZES),
  stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(10000),
});

const price = (label) =>
  z.coerce.number({ error: `${label} must be a number.` }).int(`${label} must be in whole rupees.`).min(0, `${label} cannot be negative.`).max(1_000_000);

export const productInput = z
  .object({
    name: text(3, 120, "Name"),
    description: z
      .string({ error: "Description is required." })
      .transform(cleanMultiline)
      .pipe(z.string().min(20, "Description must be at least 20 characters.").max(4000)),
    price: price("Price"),
    compareAtPrice: price("Compare-at price").nullish(),
    category: objectId,
    team: optionalText(80, "Team"),
    season: optionalText(20, "Season"),
    kitType: z.enum(KIT_TYPES).default("home"),
    details: z.array(text(2, 160, "Detail")).max(8).default([]),
    images: z.array(imageInput).max(8, "A product can have up to 8 images.").default([]),
    sizes: z
      .array(sizeInput)
      .min(1, "Add at least one size.")
      .refine((sizes) => new Set(sizes.map((s) => s.label)).size === sizes.length, "Each size can only be listed once."),
    sku: optionalText(40, "SKU"),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine((p) => !p.compareAtPrice || p.compareAtPrice > p.price, {
    path: ["compareAtPrice"],
    message: "Compare-at price must be higher than the price.",
  });

export const productPatch = z.object({
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const categoryInput = z.object({
  name: text(2, 60, "Name"),
  description: optionalText(280, "Description"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

// ---------- Cart ----------

const cartLine = z.object({
  productId: objectId,
  size: z.enum(SIZES, { error: "Choose a size." }),
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE, `You can buy up to ${MAX_QTY_PER_LINE} of one item.`),
});

export const addCartItemSchema = cartLine;
export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE, `You can buy up to ${MAX_QTY_PER_LINE} of one item.`),
});
export const cartItemParam = z.object({ itemId: objectId });
// Guest carts send only ids, sizes and quantities; the server prices them.
export const cartLinesSchema = z.object({ items: z.array(cartLine).max(MAX_CART_LINES) });

// ---------- Orders ----------

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: text(2, 80, "Full name"),
    phone: z.string({ error: "Enter a 10-digit Indian mobile number." }).trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
    line1: text(4, 120, "Address"),
    line2: optionalText(120, "Address line 2"),
    city: text(2, 60, "City"),
    state: text(2, 60, "State"),
    postalCode: z.string({ error: "Enter a 6-digit PIN code." }).trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code."),
  }),
  paymentMethod: z.literal("cod").default("cod"),
});

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

export const adminOrderListQuery = z.object({
  status: z.enum(["all", ...ORDER_STATUSES]).default("all"),
  q: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------- Chat ----------

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1200),
      }),
    )
    .min(1)
    .max(20)
    .refine((messages) => messages.at(-1).role === "user", "The last message must come from the shopper."),
  productSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/).optional(),
});
