import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { CSRF, Product, createProduct, createUser, request, setupDatabase, signedInAgent, teardownDatabase } from "./helpers.js";

const ADDRESS = { fullName: "Asha Rao", phone: "9876543210", line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", postalCode: "560001" };

let alice;
let bob;
let product;

before(async () => {
  await setupDatabase();
  await createUser({ email: "alice@example.com" });
  await createUser({ email: "bob@example.com" });
  alice = await signedInAgent("alice@example.com");
  bob = await signedInAgent("bob@example.com");
  product = await createProduct({ price: 1999 });
});
after(teardownDatabase);

describe("cart pricing", () => {
  it("ignores any price the client sends and uses the database price", async () => {
    const res = await alice.post("/api/cart/items").set(CSRF).send({ productId: product.id, size: "M", quantity: 2, price: 1, unitPrice: 1 });
    assert.equal(res.status, 201);
    assert.equal(res.body.items[0].unitPrice, 1999);
    assert.equal(res.body.summary.subtotal, 3998);
    assert.equal(res.body.summary.shippingFee, 0, "free shipping over ₹2,999");
  });

  it("refuses quantities above stock", async () => {
    const res = await alice.post("/api/cart/items").set(CSRF).send({ productId: product.id, size: "L", quantity: 2 });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.details.available, 1);
  });

  it("prices a guest bag on the server without storing anything", async () => {
    const res = await request().post("/api/cart/quote").set(CSRF).send({ items: [{ productId: product.id, size: "M", quantity: 1 }] });
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.total, 1999 + 99);
  });

  it("rejects malformed ids", async () => {
    const res = await alice.post("/api/cart/items").set(CSRF).send({ productId: "../../etc", size: "M", quantity: 1 });
    assert.equal(res.status, 400);
  });
});

describe("checkout", () => {
  let orderId;

  it("validates the address", async () => {
    const res = await alice.post("/api/orders").set(CSRF).send({ shippingAddress: { ...ADDRESS, phone: "12345", postalCode: "abc" } });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details.fields["shippingAddress.phone"]);
  });

  it("places an order, decrements stock and empties the bag", async () => {
    const res = await alice.post("/api/orders").set(CSRF).send({ shippingAddress: ADDRESS });
    assert.equal(res.status, 201);
    orderId = res.body.order.id;
    assert.equal(res.body.order.total, 3998);

    const fresh = await Product.findById(product.id);
    assert.equal(fresh.sizes.find((s) => s.label === "M").stock, 3);
    assert.equal(fresh.stock, 4);

    const cart = await alice.get("/api/cart");
    assert.equal(cart.body.items.length, 0);
  });

  it("does not let one customer read another customer's order", async () => {
    const own = await alice.get(`/api/orders/${orderId}`);
    assert.equal(own.status, 200);
    const other = await bob.get(`/api/orders/${orderId}`);
    assert.equal(other.status, 404);
  });

  it("sells the last unit only once when two shoppers check out together", async () => {
    await alice.post("/api/cart/items").set(CSRF).send({ productId: product.id, size: "L", quantity: 1 });
    await bob.post("/api/cart/items").set(CSRF).send({ productId: product.id, size: "L", quantity: 1 });

    const results = await Promise.all([
      alice.post("/api/orders").set(CSRF).send({ shippingAddress: ADDRESS }),
      bob.post("/api/orders").set(CSRF).send({ shippingAddress: ADDRESS }),
    ]);
    const statuses = results.map((r) => r.status).sort();
    assert.deepEqual(statuses, [201, 409]);

    const fresh = await Product.findById(product.id);
    assert.equal(fresh.sizes.find((s) => s.label === "L").stock, 0, "never negative");
  });
});
