// Loads the demo catalogue, reviews, demo accounts and a few sample orders.
//
//   npm run seed            add anything missing (safe to re-run)
//   npm run seed -- --reset wipe catalogue, reviews, carts and orders first
//
// Product images are uploaded through the same storage driver the API uses:
// Cloudinary when it is configured, local disk otherwise. The catalogue comes
// from seed/data/catalog.json (see seed/fetchCatalog.js).
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { Review } from "../src/models/Review.js";
import { User } from "../src/models/User.js";
import { Cart } from "../src/models/Cart.js";
import { Order } from "../src/models/Order.js";
import { getStorage, normalizeImage } from "../src/services/imageStorage.js";
import { refreshProductRating } from "../src/services/reviews.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const DAY = 24 * 60 * 60 * 1000;
const VIEW_ALT = ["front view", "side view", "detail", "alternate view"];

async function loadCatalog() {
  return JSON.parse(await fs.readFile(path.join(here, "data", "catalog.json"), "utf8"));
}

async function seedCategories(categories) {
  const bySlug = new Map();
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate({ slug: category.slug }, { $setOnInsert: category }, { upsert: true, new: true });
    bySlug.set(category.slug, doc);
  }
  return bySlug;
}

async function uploadImages(item) {
  const storage = getStorage();
  const images = [];
  for (const [i, file] of item.images.entries()) {
    const buffer = await fs.readFile(path.join(here, "images", file));
    const saved = await storage.save(await normalizeImage(buffer, file));
    images.push({ ...saved, alt: `${item.name}, ${VIEW_ALT[i] ?? "view"}` });
  }
  return images;
}

async function seedProducts(products, categoryBySlug) {
  let created = 0;
  for (const item of products) {
    if (await Product.exists({ slug: item.slug })) continue;

    const createdAt = new Date(Date.now() - item.ageDays * DAY);
    const product = new Product({
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      category: categoryBySlug.get(item.category)._id,
      brand: item.brand,
      gender: item.gender,
      details: item.details,
      sizes: item.sizes,
      sku: item.sku,
      isFeatured: item.isFeatured,
      salesCount: item.salesCount,
      images: await uploadImages(item),
      createdAt,
      updatedAt: createdAt,
    });
    await product.save({ timestamps: false });

    await Review.insertMany(
      item.reviews.map((r) => ({
        product: product._id,
        authorName: r.authorName,
        rating: r.rating,
        body: r.body,
        createdAt: new Date(Date.now() - r.daysAgo * DAY),
      })),
    );
    await refreshProductRating(product._id);

    created += 1;
    process.stdout.write(".");
  }
  if (created) process.stdout.write("\n");
  return created;
}

async function seedUser({ email, password, name, role }) {
  if (!email || !password) return null;
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ email, name, role });
    await user.setPassword(password);
    await user.save();
    console.log(`Created ${role}: ${email}`);
  } else if (user.role !== role) {
    user.role = role;
    await user.save();
  }
  return user;
}

async function seedOrders(customer) {
  if (!customer || (await Order.exists({ user: customer._id }))) return 0;

  const picks = await Product.find({ stock: { $gt: 0 } }).sort({ salesCount: -1 }).limit(8);
  const plans = [
    { status: "delivered", age: 21, lines: [[0, 1], [3, 1]] },
    { status: "shipped", age: 3, lines: [[1, 2]] },
    { status: "placed", age: 0.2, lines: [[5, 1], [6, 1]] },
  ];
  const address = { fullName: "Aarav Mehta", phone: "9876543210", line1: "14, 3rd Cross, Indiranagar", line2: "Near the metro", city: "Bengaluru", state: "Karnataka", postalCode: "560038" };

  for (const [index, plan] of plans.entries()) {
    const items = plan.lines.map(([i, quantity]) => {
      const p = picks[i];
      const size = p.sizes.find((s) => s.stock > 0)?.label ?? p.sizes[0].label;
      return { product: p._id, name: p.name, slug: p.slug, image: p.images[0]?.url ?? "", size, unitPrice: p.price, quantity, lineTotal: p.price * quantity };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shippingFee = subtotal >= 2999 ? 0 : 99;
    const createdAt = new Date(Date.now() - plan.age * DAY);
    await Order.create({
      orderNumber: `TRC-${createdAt.toISOString().slice(2, 10).replace(/-/g, "")}-DEMO${index + 1}`,
      user: customer._id,
      items,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      shippingAddress: address,
      status: plan.status,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return plans.length;
}

async function main() {
  await connectDatabase();
  console.log(`Seeding ${config.MONGODB_URI.replace(/\/\/[^@]*@/, "//***@")} (images: ${getStorage().name})`);

  if (process.argv.includes("--reset")) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Review.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
    console.log("Cleared catalogue, reviews, carts and orders.");
  }

  await Promise.all([User, Product, Category, Order, Cart, Review].map((model) => model.syncIndexes()));

  const catalog = await loadCatalog();
  const categoryBySlug = await seedCategories(catalog.categories);
  const created = await seedProducts(catalog.products, categoryBySlug);
  console.log(`Products: ${created} created, ${catalog.products.length - created} already present.`);

  await seedUser({ email: config.SEED_ADMIN_EMAIL, password: config.SEED_ADMIN_PASSWORD, name: "Store Admin", role: "admin" });
  const customer = await seedUser({ email: config.SEED_CUSTOMER_EMAIL, password: config.SEED_CUSTOMER_PASSWORD, name: "Aarav Mehta", role: "customer" });
  const orders = await seedOrders(customer);
  if (orders) console.log(`Created ${orders} sample orders for ${customer.email}.`);

  await disconnectDatabase();
  console.log("Done.");
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
