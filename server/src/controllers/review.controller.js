import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { AppError } from "../utils/AppError.js";
import { paginate } from "../services/catalog.js";
import { ratingBreakdown, refreshProductRating } from "../services/reviews.js";
import { invalidateCatalogCache } from "../services/chat/knowledge.js";
import { escapeRegex } from "../utils/text.js";

async function findLiveProduct(slug) {
  const product = await Product.findOne({ slug, isActive: true }).select("_id rating reviewCount");
  if (!product) throw AppError.notFound("We couldn't find that product.");
  return product;
}

export async function listProductReviews(req, res) {
  const product = await findLiveProduct(req.valid.params.slug);
  const { page, limit, sort } = req.valid.query;
  const order = { newest: { createdAt: -1 }, highest: { rating: -1, createdAt: -1 }, lowest: { rating: 1, createdAt: -1 } }[sort];

  const [items, total, breakdown, mine] = await Promise.all([
    Review.find({ product: product._id }).select("-user").sort(order).skip((page - 1) * limit).limit(limit),
    Review.countDocuments({ product: product._id }),
    ratingBreakdown(product._id),
    req.user ? Review.findOne({ product: product._id, user: req.user._id }).select("-user") : null,
  ]);

  res.json({
    items,
    pagination: paginate(page, limit, total),
    summary: { average: product.rating, count: product.reviewCount, breakdown },
    mine,
  });
}

export async function createReview(req, res) {
  const product = await findLiveProduct(req.valid.params.slug);
  const { rating, title = "", body } = req.valid.body;

  if (await Review.exists({ product: product._id, user: req.user._id })) {
    throw AppError.conflict("You've already reviewed this product.", { code: "ALREADY_REVIEWED" });
  }

  const verified = Boolean(await Order.exists({ user: req.user._id, "items.product": product._id, status: { $ne: "cancelled" } }));
  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    authorName: req.user.name,
    rating,
    title,
    body,
    verified,
  });

  await refreshProductRating(product._id);
  invalidateCatalogCache();
  const { user: _omit, ...publicReview } = review.toJSON();
  res.status(201).json({ review: publicReview });
}

// A few recent, well-rated reviews for the home page.
export async function reviewHighlights(_req, res) {
  const reviews = await Review.find({ rating: { $gte: 4 }, body: { $regex: /^.{12,}/ } })
    .select("-user")
    .sort({ rating: -1, createdAt: -1 })
    .limit(30)
    .populate({ path: "product", select: "name slug images isActive", match: { isActive: true } });

  const seen = new Set();
  const items = [];
  for (const r of reviews) {
    if (!r.product || seen.has(String(r.product._id))) continue;
    seen.add(String(r.product._id));
    items.push({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      verified: r.verified,
      product: { name: r.product.name, slug: r.product.slug, image: r.product.images[0]?.url ?? "" },
    });
    if (items.length === 6) break;
  }

  const [stats] = await Review.aggregate([{ $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  res.json({ items, average: stats ? Math.round(stats.average * 10) / 10 : 0, count: stats?.count ?? 0 });
}

export async function adminListReviews(req, res) {
  const { q, rating, page, limit } = req.valid.query;
  const filter = {};
  if (rating) filter.rating = rating;
  if (q) filter.$or = [{ body: new RegExp(escapeRegex(q), "i") }, { authorName: new RegExp(escapeRegex(q), "i") }];

  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate("product", "name slug images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ items, pagination: paginate(page, limit, total) });
}

export async function adminDeleteReview(req, res) {
  const review = await Review.findByIdAndDelete(req.valid.params.id);
  if (!review) throw AppError.notFound("Review not found.");
  await refreshProductRating(review.product);
  invalidateCatalogCache();
  res.status(204).end();
}
