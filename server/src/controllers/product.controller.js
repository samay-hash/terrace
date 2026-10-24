import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { buildProductFilter, paginate, sortFor } from "../services/catalog.js";

// Fields shoppers need on a product card.
const CARD_FIELDS = "name slug price compareAtPrice images brand gender stock sizes isFeatured category rating reviewCount createdAt";

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

// Options for the shop filters (price range, brands, sizes), scoped to live
// products and, when given, to one category.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
function sizeRank(label) {
  const clothing = SIZE_ORDER.indexOf(label);
  if (clothing !== -1) return clothing;
  const uk = /^UK (\d+(\.\d)?)$/.exec(label);
  if (uk) return 100 + Number(uk[1]);
  return label === "One size" ? 1000 : 500;
}

export async function getFacets(req, res) {
  const { category } = req.valid.query;
  const match = await buildProductFilter({ category });

  const [result] = await Product.aggregate([
    { $match: match },
    {
      $facet: {
        price: [{ $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" }, count: { $sum: 1 } } }],
        brands: [{ $match: { brand: { $ne: "" } } }, { $group: { _id: "$brand", count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        sizes: [{ $unwind: "$sizes" }, { $match: { "sizes.stock": { $gt: 0 } } }, { $group: { _id: "$sizes.label" } }],
      },
    },
  ]);

  const bounds = result.price[0];
  res.json({
    total: bounds?.count ?? 0,
    price: { min: bounds?.min ?? 0, max: bounds?.max ?? 0 },
    brands: result.brands.map((b) => ({ name: b._id, count: b.count })),
    sizes: result.sizes.map((s) => s._id).sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b)),
  });
}
