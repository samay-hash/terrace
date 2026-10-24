import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Review } from "../models/Review.js";
import { Subscriber } from "../models/Subscriber.js";
import { LOW_STOCK_THRESHOLD } from "../services/catalog.js";

export async function getOverview(_req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [products, activeProducts, outOfStock, lowStock, customers, categories, revenue, recentOrders, openOrders, reviews, subscribers] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: 0 }),
      Product.find({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } })
        .select("name slug stock sizes images")
        .sort({ stock: 1 })
        .limit(6),
      User.countDocuments({ role: "customer" }),
      Category.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$total" }, orders: { $sum: 1 } } },
      ]),
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(6),
      Order.countDocuments({ status: { $in: ["placed", "packed"] } }),
      Review.countDocuments(),
      Subscriber.countDocuments(),
    ]);

  res.json({
    counts: { products, activeProducts, outOfStock, customers, categories, openOrders, reviews, subscribers },
    last30Days: { revenue: revenue[0]?.total ?? 0, orders: revenue[0]?.orders ?? 0 },
    lowStock,
    recentOrders,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });
}
