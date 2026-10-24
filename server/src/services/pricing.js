import { Product } from "../models/Product.js";

export const FREE_SHIPPING_THRESHOLD = 2999;
export const SHIPPING_FEE = 99;

export function shippingFor(subtotal) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

// Turns a list of { productId, size, quantity } into priced lines using live
// product data. Whatever the client believes about price or stock is ignored.
//
// Each line reports an `issue` when it cannot be bought as requested:
//   unavailable  - product removed or unpublished
//   size         - that size is no longer offered
//   out_of_stock - size exists but has no stock
//   limited      - fewer in stock than requested; quantity was reduced
export async function priceLines(lines) {
  const ids = [...new Set(lines.map((line) => String(line.productId)))];
  const products = await Product.find({ _id: { $in: ids } })
    .select("name slug price compareAtPrice images sizes isActive team")
    .lean();
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const items = lines.map((line) => {
    const product = byId.get(String(line.productId));
    const base = {
      id: line.id ? String(line.id) : undefined,
      productId: String(line.productId),
      size: line.size,
      requestedQuantity: line.quantity,
    };

    if (!product || !product.isActive) {
      return { ...base, quantity: 0, unitPrice: 0, lineTotal: 0, available: 0, issue: "unavailable" };
    }

    const sizeEntry = product.sizes.find((s) => s.label === line.size);
    const available = sizeEntry?.stock ?? 0;
    const quantity = Math.min(line.quantity, available);
    let issue = null;
    if (!sizeEntry) issue = "size";
    else if (available === 0) issue = "out_of_stock";
    else if (quantity < line.quantity) issue = "limited";

    return {
      ...base,
      slug: product.slug,
      name: product.name,
      team: product.team,
      image: product.images[0]?.url ?? "",
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      quantity,
      available,
      lineTotal: product.price * quantity,
      issue,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = shippingFor(subtotal);

  return {
    items,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping: subtotal > 0 ? Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal) : FREE_SHIPPING_THRESHOLD,
    },
  };
}
