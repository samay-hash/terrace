import { Category } from "../models/Category.js";
import { escapeRegex } from "../utils/text.js";

const SORTS = {
  featured: { isFeatured: -1, salesCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  "price-asc": { price: 1, createdAt: -1 },
  "price-desc": { price: -1, createdAt: -1 },
  popular: { salesCount: -1, createdAt: -1 },
  rating: { rating: -1, reviewCount: -1 },
  name: { name: 1 },
  "stock-asc": { stock: 1, name: 1 },
  updated: { updatedAt: -1 },
};

export const LOW_STOCK_THRESHOLD = 20;

// Builds a Mongo filter from validated query values. Search text is escaped
// before it becomes a regex; every other value is an enum, number or slug.
export async function buildProductFilter(query, { includeInactive = false } = {}) {
  const filter = {};

  if (!includeInactive) filter.isActive = true;
  else if (query.status === "active") filter.isActive = true;
  else if (query.status === "draft") filter.isActive = false;

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: pattern }, { brand: pattern }, { sku: pattern }];
  }

  if (query.category) {
    const category = await Category.findOne({ slug: query.category }).select("_id").lean();
    // Unknown category: match nothing rather than silently ignoring the filter.
    filter.category = category?._id ?? null;
  }

  if (query.brand) filter.brand = new RegExp(`^${escapeRegex(query.brand)}$`, "i");
  if (query.gender) filter.gender = query.gender === "unisex" ? "unisex" : { $in: [query.gender, "unisex"] };
  if (query.minRating) filter.rating = { $gte: query.minRating };
  if (query.size) filter.sizes = { $elemMatch: { label: query.size, stock: { $gt: 0 } } };
  if (query.inStock) filter.stock = { $gt: 0 };
  if (query.featured) filter.isFeatured = true;
  if (query.onSale) filter.$expr = { $gt: ["$compareAtPrice", "$price"] };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  if (query.stock === "low") filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
  if (query.stock === "out") filter.stock = 0;

  return filter;
}

export function sortFor(key) {
  return SORTS[key] ?? SORTS.featured;
}

export function paginate(page, limit, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
