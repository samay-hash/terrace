import crypto from "node:crypto";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { priceLines } from "../services/pricing.js";
import { escapeRegex } from "../utils/text.js";
import { paginate } from "../services/catalog.js";

function newOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `TRC-${date}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

// Decrements stock for one line only if enough is left. The check and the
// decrement happen in a single atomic update, so two shoppers racing for the
// last shirt cannot both get it.
async function reserve(line) {
  const result = await Product.updateOne(
    { _id: line.productId, isActive: true, sizes: { $elemMatch: { label: line.size, stock: { $gte: line.quantity } } } },
    { $inc: { "sizes.$.stock": -line.quantity, stock: -line.quantity, salesCount: line.quantity } },
  );
  return result.modifiedCount === 1;
}

async function release(line) {
  await Product.updateOne(
    { _id: line.productId, "sizes.label": line.size },
    { $inc: { "sizes.$.stock": line.quantity, stock: line.quantity, salesCount: -line.quantity } },
  );
}

export async function placeOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length) throw AppError.badRequest("Your bag is empty.", { code: "CART_EMPTY" });

  const priced = await priceLines(
    cart.items.map((item) => ({ productId: item.product, size: item.size, quantity: item.quantity })),
  );

  const problem = priced.items.find((item) => item.issue);
  if (problem) {
    throw AppError.conflict("Some items in your bag changed. Review your bag before placing the order.", {
      code: "CART_CHANGED",
      details: { items: priced.items.filter((item) => item.issue) },
    });
  }

  const reserved = [];
  for (const line of priced.items) {
    if (await reserve(line)) {
      reserved.push(line);
      continue;
    }
    await Promise.all(reserved.map(release));
    throw AppError.conflict(`${line.name} in size ${line.size} just sold out. Your bag has been updated.`, {
      code: "OUT_OF_STOCK",
    });
  }

  try {
    const order = await Order.create({
      orderNumber: newOrderNumber(),
      user: req.user._id,
      items: priced.items.map((line) => ({
        product: line.productId,
        name: line.name,
        slug: line.slug,
        image: line.image,
        size: line.size,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      subtotal: priced.summary.subtotal,
      shippingFee: priced.summary.shippingFee,
      total: priced.summary.total,
      shippingAddress: req.valid.body.shippingAddress,
      paymentMethod: req.valid.body.paymentMethod,
    });

    cart.items = [];
    await cart.save();
    res.status(201).json({ order });
  } catch (error) {
    await Promise.all(reserved.map(release));
    throw error;
  }
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ items: orders });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.valid.params.id);
  // Customers only see their own orders; a 404 avoids confirming that
  // someone else's order id exists.
  if (!order || (req.user.role !== "admin" && !order.user.equals(req.user._id))) {
    throw AppError.notFound("Order not found.");
  }
  res.json({ order });
}

export async function adminListOrders(req, res) {
  const { status, q, page, limit } = req.valid.query;
  const filter = {};
  if (status !== "all") filter.status = status;
  if (q) filter.orderNumber = new RegExp(escapeRegex(q), "i");

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ items, pagination: paginate(page, limit, total) });
}

const NEXT_STATUSES = {
  placed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.valid.params.id);
  if (!order) throw AppError.notFound("Order not found.");

  const next = req.valid.body.status;
  if (!NEXT_STATUSES[order.status].includes(next)) {
    throw AppError.conflict(`An order that is ${order.status} cannot be marked ${next}.`, { code: "INVALID_TRANSITION" });
  }

  // Cancelling puts the stock back on the shelf.
  if (next === "cancelled") {
    await Promise.all(
      order.items.filter((item) => item.product).map((item) => release({ productId: item.product, size: item.size, quantity: item.quantity })),
    );
  }

  order.status = next;
  await order.save();
  await order.populate("user", "name email");
  res.json({ order });
}
