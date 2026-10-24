import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { buildProductFilter, paginate, sortFor } from "../services/catalog.js";

// Fields shoppers need on a product card.
const CARD_FIELDS = "name slug price compareAtPrice images team season kitType stock sizes isFeatured category createdAt";

export async function listProducts(req, res) {
  const query = req.valid.query;
  const filter = await buildProductFilter(query);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(CARD_FIELDS)
      .populate("category", "name slug")
      .sort(sortFor(query.sort))
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Product.countDocuments(filter),
  ]);

  res.json({ items, pagination: paginate(query.page, query.limit, total) });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ slug: req.valid.params.slug, isActive: true }).populate(
    "category",
    "name slug",
  );
  if (!product) throw AppError.notFound("We couldn't find that product. It may have been removed.");

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category._id,
    isActive: true,
    stock: { $gt: 0 },
  })
    .select(CARD_FIELDS)
    .populate("category", "name slug")
    .sort({ salesCount: -1 })
    .limit(4);

  res.json({ product, related });
}

// Price bounds and counts for the shop filters, scoped to live products.
export async function getFacets(_req, res) {
  const [bounds] = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" }, count: { $sum: 1 } } },
  ]);
  res.json({ price: { min: bounds?.min ?? 0, max: bounds?.max ?? 0 }, total: bounds?.count ?? 0 });
}
