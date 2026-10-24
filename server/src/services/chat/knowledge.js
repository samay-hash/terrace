import { Product } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { Order } from "../../models/Order.js";
import { Cart } from "../../models/Cart.js";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, priceLines } from "../pricing.js";

// Everything Chotu is allowed to state as fact about the store. The model is
// told to answer only from this and the live catalogue below.
export const STORE_POLICIES = {
  about:
    "Terrace is an independent kit studio from Bengaluru. We design original football, cricket and basketball shirts and faithful tributes to classic kits, with our own crests (no licensed club badges).",
  shipping: `Free shipping on orders of ₹${FREE_SHIPPING_THRESHOLD.toLocaleString("en-IN")} or more; otherwise a flat ₹${SHIPPING_FEE}. Orders placed before 2 pm on a weekday leave the studio the same day. Delivery takes 3–5 business days to metro cities and up to 8 business days elsewhere in India.`,
  payment: "Cash on delivery is available across India. Online payment is coming soon.",
  returns:
    "Free returns or size exchanges within 30 days of delivery, as long as the shirt is unworn, unwashed and has its tags. Start a return from the order page or by emailing care@terracekits.in. Refunds for cash-on-delivery orders go to your bank account within 5 business days of the return reaching us.",
  sizing:
    "Shirts are a regular fit. Chest measurements (body, not garment): XS 86–91 cm, S 91–96 cm, M 96–101 cm, L 101–106 cm, XL 106–112 cm, XXL 112–118 cm. Retro shirts are cut slightly boxier: if you are between sizes, size down for retro and up for current-season kits.",
  care: "Wash inside out at 30°C, do not tumble dry, and never iron printed numbers or crests.",
  contact: "Email care@terracekits.in or call +91 80 4000 2626 (Mon–Sat, 10 am–7 pm IST).",
};

const CATALOG_TTL_MS = 60_000;
let catalogCache = { at: 0, products: [], categories: [] };

// Compact view of the live catalogue, refreshed at most once a minute.
export async function getCatalog() {
  if (Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache;

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true })
      .select("name slug price compareAtPrice team season kitType sizes stock description details category images salesCount createdAt isFeatured")
      .populate("category", "name slug")
      .sort({ name: 1 })
      .lean(),
    Category.find().sort({ sortOrder: 1 }).select("name slug description").lean(),
  ]);

  catalogCache = { at: Date.now(), products, categories };
  return catalogCache;
}

export function invalidateCatalogCache() {
  catalogCache = { at: 0, products: [], categories: [] };
}

export function sizesInStock(product) {
  return product.sizes.filter((s) => s.stock > 0).map((s) => s.label);
}

// One line per product, stable order, so the prompt prefix caches well.
export function catalogToText(products) {
  return products
    .map((p) => {
      const sale = p.compareAtPrice > p.price ? ` (was ₹${p.compareAtPrice})` : "";
      const sizes = sizesInStock(p);
      return [
        `slug=${p.slug}`,
        `name=${p.name}`,
        `category=${p.category?.name ?? ""}`,
        `type=${p.kitType}`,
        p.team ? `team=${p.team}` : null,
        p.season ? `season=${p.season}` : null,
        `price=₹${p.price}${sale}`,
        `in_stock_sizes=${sizes.length ? sizes.join("/") : "sold out"}`,
        `about=${p.description.split("\n")[0].slice(0, 180)}`,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");
}

// Shopper-specific facts (bag and recent orders) for a signed-in user.
export async function getShopperContext(user) {
  if (!user) return null;
  const [cart, orders] = await Promise.all([
    Cart.findOne({ user: user._id }).lean(),
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const bag = cart?.items.length
    ? await priceLines(cart.items.map((i) => ({ productId: i.product, size: i.size, quantity: i.quantity })))
    : null;

  return {
    firstName: user.name.split(" ")[0],
    bag: bag
      ? {
          lines: bag.items.filter((i) => i.quantity > 0).map((i) => `${i.quantity} × ${i.name} (${i.size}) ₹${i.lineTotal}`),
          subtotal: bag.summary.subtotal,
          amountToFreeShipping: bag.summary.amountToFreeShipping,
        }
      : null,
    orders: orders.map((o) => ({
      number: o.orderNumber,
      status: o.status,
      total: o.total,
      placedOn: o.createdAt.toISOString().slice(0, 10),
    })),
  };
}

export function toCard(product) {
  return {
    id: String(product._id),
    slug: product.slug,
    name: product.name,
    team: product.team,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    image: product.images?.[0]?.url ?? "",
    inStock: product.stock > 0,
  };
}
