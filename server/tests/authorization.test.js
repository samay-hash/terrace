import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { CSRF, Category, createProduct, createUser, request, setupDatabase, signedInAgent, teardownDatabase } from "./helpers.js";

let customer;
let admin;
let product;

before(async () => {
  await setupDatabase();
  await createUser({ email: "customer@example.com" });
  await createUser({ email: "admin@example.com", role: "admin" });
  customer = await signedInAgent("customer@example.com");
  admin = await signedInAgent("admin@example.com");
  product = await createProduct();
});
after(teardownDatabase);

const ADMIN_ROUTES = [
  ["get", "/api/admin/overview"],
  ["get", "/api/admin/products"],
  ["post", "/api/admin/products"],
  ["put", "/api/admin/products/000000000000000000000000"],
  ["delete", "/api/admin/products/000000000000000000000000"],
  ["post", "/api/admin/uploads"],
  ["get", "/api/admin/categories"],
  ["post", "/api/admin/categories"],
  ["get", "/api/admin/orders"],
  ["patch", "/api/admin/orders/000000000000000000000000/status"],
];

describe("admin API is enforced on the server", () => {
  for (const [method, path] of ADMIN_ROUTES) {
    it(`${method.toUpperCase()} ${path}: 401 for guests, 403 for customers`, async () => {
      const guest = await request()[method](path).set(CSRF).send({});
      assert.equal(guest.status, 401);
      const asCustomer = await customer[method](path).set(CSRF).send({});
      assert.equal(asCustomer.status, 403);
    });
  }

  it("lets an admin in", async () => {
    const res = await admin.get("/api/admin/overview");
    assert.equal(res.status, 200);
    assert.equal(res.body.counts.products, 1);
  });

  it("loses admin access as soon as the role is removed in the database", async () => {
    const { User } = await import("../src/models/User.js");
    await createUser({ email: "temp-admin@example.com", role: "admin" });
    const agent = await signedInAgent("temp-admin@example.com");
    await User.updateOne({ email: "temp-admin@example.com" }, { role: "customer" });
    const res = await agent.get("/api/admin/overview");
    assert.equal(res.status, 403);
  });
});

describe("product management", () => {
  it("validates product input and creates a product with a unique slug", async () => {
    const category = await Category.findOne({ slug: "test-kits" });
    const bad = await admin.post("/api/admin/products").set(CSRF).send({ name: "X", price: -5, category: category.id, sizes: [] });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.error.details.fields.price);

    const payload = {
      name: "Test Home Shirt",
      description: "A second shirt with the same name to check slug uniqueness.",
      price: 2100,
      category: category.id,
      sizes: [{ label: "M", stock: 3 }],
      images: [],
    };
    const created = await admin.post("/api/admin/products").set(CSRF).send(payload);
    assert.equal(created.status, 201);
    assert.equal(created.body.product.stock, 3, "stock is the sum of sizes");
    assert.notEqual(created.body.product.slug, product.slug);
  });

  it("refuses image URLs that did not come from our upload endpoint", async () => {
    const category = await Category.findOne({ slug: "test-kits" });
    const res = await admin
      .post("/api/admin/products")
      .set(CSRF)
      .send({
        name: "Hotlinked Shirt",
        description: "Trying to point the product at an external tracking pixel.",
        price: 999,
        category: category.id,
        sizes: [{ label: "M", stock: 1 }],
        images: [{ url: "https://evil.example/pixel.png", publicId: "anything" }],
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_IMAGE_SOURCE");
  });

  it("hides unpublished products from shoppers but not from admins", async () => {
    const hidden = await createProduct({ isActive: false });
    const publicRes = await request().get(`/api/products/${hidden.slug}`);
    assert.equal(publicRes.status, 404);
    const adminRes = await admin.get(`/api/admin/products/${hidden.id}`);
    assert.equal(adminRes.status, 200);
  });

  it("will not delete a category that still has products", async () => {
    const category = await Category.findOne({ slug: "test-kits" });
    const res = await admin.delete(`/api/admin/categories/${category.id}`).set(CSRF);
    assert.equal(res.status, 409);
  });
});
