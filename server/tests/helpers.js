// Shared setup for the API test suite. Environment variables are set before
// the app is imported, because config/env.js reads them once at load time.
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST ?? "mongodb://127.0.0.1:27017/terrace_test";
process.env.JWT_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.ANTHROPIC_API_KEY;

const { createApp } = await import("../src/app.js");
const { connectDatabase } = await import("../src/config/db.js");
const { User } = await import("../src/models/User.js");
const { Category } = await import("../src/models/Category.js");
const { Product } = await import("../src/models/Product.js");
const supertest = (await import("supertest")).default;

export { User, Category, Product };
export const app = createApp();
export const CSRF = { "X-Requested-With": "terrace" };

export async function setupDatabase() {
  await connectDatabase(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
}

export async function teardownDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function createUser({ email, password = "Password123", role = "customer", name = "Test User" }) {
  const user = new User({ email, name, role });
  await user.setPassword(password);
  await user.save();
  return user;
}

// Returns a supertest agent that keeps the session cookie between requests.
export async function signedInAgent(email, password = "Password123") {
  const agent = supertest.agent(app);
  const res = await agent.post("/api/auth/login").set(CSRF).send({ email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

export function request() {
  return supertest(app);
}

export async function createProduct(overrides = {}) {
  const category =
    (await Category.findOne({ slug: "test-kits" })) ?? (await Category.create({ name: "Test kits", slug: "test-kits" }));
  const product = new Product({
    name: "Test Home Shirt",
    slug: `test-home-shirt-${Math.random().toString(36).slice(2, 8)}`,
    description: "A shirt used by the automated test suite.",
    price: 1999,
    category: category._id,
    sizes: [
      { label: "M", stock: 5 },
      { label: "L", stock: 1 },
    ],
    images: [{ url: "/uploads/test-image.webp", publicId: "local/test-image" }],
    ...overrides,
  });
  await product.save();
  return product;
}
