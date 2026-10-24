// Loads the demo catalogue, demo accounts and a few sample orders.
//
//   npm run seed            add anything missing (safe to re-run)
//   npm run seed -- --reset wipe catalogue, carts and orders first
//
// Product images are uploaded through the same storage driver the API uses:
// Cloudinary when it is configured, local disk otherwise.
import fs from "node:fs/promises";
import { config } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { Category } from "../src/models/Category.js";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";
import { Cart } from "../src/models/Cart.js";
import { Order } from "../src/models/Order.js";
import { getStorage, normalizeImage } from "../src/services/imageStorage.js";
import { slugify } from "../src/utils/text.js";
import { categories, products } from "./catalog.js";
import { VIEWS, imagePath } from "./renderImages.js";

const DAY = 24 * 60 * 60 * 1000;
const VIEW_ALT = { front: "front", back: "back", detail: "crest and fabric close-up" };

async function seedCategories() {
  const bySlug = new Map();
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate({ slug: category.slug }, { $setOnInsert: category }, { upsert: true, new: true });
    bySlug.set(category.slug, doc);
  }
  return bySlug;
}

async function uploadImages(slug, name) {
  const storage = getStorage();
  const images = [];
  for (const view of VIEWS) {
    const buffer = await fs.readFile(imagePath(slug, view));
    const normalized = await normalizeImage(buffer, `${slug}-${view}.webp`);
    const saved = await storage.save(normalized);
    images.push({ ...saved, alt: `${name}, ${VIEW_ALT[view]}` });
  }
  return images;
}

async function seedProducts(categoryBySlug) {
  let created = 0;
  for (const item of products) {
    const slug = slugify(item.name);
    if (await Product.exists({ slug })) continue;

    const createdAt = new Date(Date.now() - item.ageDays * DAY);
    const product = new Product({
      name: item.name,
      slug,
      description: item.description,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      category: categoryBySlug.get(item.category)._id,
      team: item.team,
      season: item.season,
      kitType: item.kitType,
      details: item.details,
      sizes: item.sizes,
      sku: `TRC-${slug.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 6)}-${String(created + 100)}`,
      isFeatured: Boolean(item.isFeatured),
      salesCount: item.salesCount,
      images: await uploadImages(slug, item.name),
      createdAt,
      updatedAt: createdAt,
    });
    await product.save({ timestamps: false });
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
    { status: "delivered", age: 21, lines: [[0, "M", 1], [3, "L", 1]] },
    { status: "shipped", age: 3, lines: [[1, "M", 2]] },
    { status: "placed", age: 0.2, lines: [[5, "L", 1], [6, "M", 1]] },
  ];
  const address = { fullName: "Aarav Fan", phone: "9876543210", line1: "14, 3rd Cross, Indiranagar", line2: "Near the metro", city: "Bengaluru", state: "Karnataka", postalCode: "560038" };

  for (const [index, plan] of plans.entries()) {
    const items = plan.lines.map(([i, size, quantity]) => {
      const p = picks[i];
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
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({})]);
    console.log("Cleared catalogue, carts and orders.");
  }

  await Promise.all([User.syncIndexes(), Product.syncIndexes(), Category.syncIndexes(), Order.syncIndexes(), Cart.syncIndexes()]);

  const categoryBySlug = await seedCategories();
  const created = await seedProducts(categoryBySlug);
  console.log(`Products: ${created} created, ${products.length - created} already present.`);

  await seedUser({ email: config.SEED_ADMIN_EMAIL, password: config.SEED_ADMIN_PASSWORD, name: "Store Admin", role: "admin" });
  const customer = await seedUser({ email: config.SEED_CUSTOMER_EMAIL, password: config.SEED_CUSTOMER_PASSWORD, name: "Aarav Fan", role: "customer" });
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
