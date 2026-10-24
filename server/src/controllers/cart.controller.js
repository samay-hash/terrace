import { Cart, MAX_CART_LINES, MAX_QTY_PER_LINE } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { priceLines } from "../services/pricing.js";

async function loadCart(userId) {
  return (await Cart.findOne({ user: userId })) ?? new Cart({ user: userId, items: [] });
}

async function respondWithCart(res, cart, status = 200) {
  const lines = cart.items.map((item) => ({
    id: item._id,
    productId: item.product,
    size: item.size,
    quantity: item.quantity,
  }));
  res.status(status).json(await priceLines(lines));
}

// Checks the product is buyable in this size and quantity. Throws a message
// the shopper can act on otherwise.
async function assertPurchasable(productId, size, quantity) {
  const product = await Product.findOne({ _id: productId, isActive: true }).select("name sizes").lean();
  if (!product) throw AppError.notFound("This product is no longer available.");

  const entry = product.sizes.find((s) => s.label === size);
  if (!entry) throw AppError.badRequest(`${product.name} is not made in size ${size}.`, { code: "SIZE_UNAVAILABLE" });
  if (entry.stock === 0) throw AppError.conflict(`Size ${size} is sold out.`, { code: "OUT_OF_STOCK" });
  if (quantity > entry.stock) {
    throw AppError.conflict(`Only ${entry.stock} left in size ${size}.`, {
      code: "INSUFFICIENT_STOCK",
      details: { available: entry.stock },
    });
  }
}

export async function getCart(req, res) {
  await respondWithCart(res, await loadCart(req.user._id));
}

export async function addItem(req, res) {
  const { productId, size, quantity } = req.valid.body;
  const cart = await loadCart(req.user._id);

  const existing = cart.items.find((item) => String(item.product) === productId && item.size === size);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > MAX_QTY_PER_LINE) {
    throw AppError.badRequest(`You can buy up to ${MAX_QTY_PER_LINE} of one item.`, { code: "QTY_LIMIT" });
  }
  if (!existing && cart.items.length >= MAX_CART_LINES) {
    throw AppError.badRequest("Your bag is full. Remove something before adding more.", { code: "CART_FULL" });
  }

  await assertPurchasable(productId, size, nextQuantity);

  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product: productId, size, quantity });
  await cart.save();

  await respondWithCart(res, cart, 201);
}

export async function updateItem(req, res) {
  const cart = await loadCart(req.user._id);
  const item = cart.items.id(req.valid.params.itemId);
  if (!item) throw AppError.notFound("That item is no longer in your bag.");

  await assertPurchasable(item.product, item.size, req.valid.body.quantity);
  item.quantity = req.valid.body.quantity;
  await cart.save();

  await respondWithCart(res, cart);
}

export async function removeItem(req, res) {
  const cart = await loadCart(req.user._id);
  const item = cart.items.id(req.valid.params.itemId);
  if (item) {
    item.deleteOne();
    await cart.save();
  }
  await respondWithCart(res, cart);
}

export async function clearCart(req, res) {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.json(await priceLines([]));
}

// Called right after sign in: folds the guest bag (kept in the browser) into
// the account bag. Quantities are capped by stock and per-line limits rather
// than rejected, so the shopper never loses their bag at login.
export async function mergeCart(req, res) {
  const cart = await loadCart(req.user._id);
  const priced = await priceLines(req.valid.body.items);

  for (const line of priced.items) {
    if (line.issue && line.issue !== "limited") continue;
    const existing = cart.items.find((item) => String(item.product) === line.productId && item.size === line.size);
    const target = Math.min((existing?.quantity ?? 0) + line.quantity, line.available, MAX_QTY_PER_LINE);
    if (existing) existing.quantity = target;
    else if (cart.items.length < MAX_CART_LINES && target > 0) {
      cart.items.push({ product: line.productId, size: line.size, quantity: target });
    }
  }

  await cart.save();
  await respondWithCart(res, cart);
}

// Prices a guest bag without storing anything.
export async function quoteCart(req, res) {
  res.json(await priceLines(req.valid.body.items));
}
