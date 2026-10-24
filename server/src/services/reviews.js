import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";

// Recalculates the average rating and count stored on the product, so
// listings can show stars without counting reviews on every request.
export async function refreshProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { rating: stats ? Math.round(stats.average * 10) / 10 : 0, reviewCount: stats?.count ?? 0 } },
  );
}

// Count of reviews per star value, 5 down to 1.
export async function ratingBreakdown(productId) {
  const rows = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);
  const byStar = new Map(rows.map((r) => [r._id, r.count]));
  return [5, 4, 3, 2, 1].map((star) => ({ star, count: byStar.get(star) ?? 0 }));
}
