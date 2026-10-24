import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { CSRF, Product, createProduct, createUser, request, setupDatabase, signedInAgent, teardownDatabase } from "./helpers.js";

let product;
let alice;
let admin;

before(async () => {
  await setupDatabase();
  await createUser({ email: "alice@example.com", name: "Alice Rao" });
  await createUser({ email: "admin@example.com", role: "admin" });
  alice = await signedInAgent("alice@example.com");
  admin = await signedInAgent("admin@example.com");
  product = await createProduct({ brand: "Haldane & Co.", sizes: [{ label: "UK 7", stock: 3 }, { label: "UK 8", stock: 2 }] });
});
after(teardownDatabase);

describe("reviews", () => {
  it("requires a signed-in customer to post", async () => {
    const res = await request().post(`/api/products/${product.slug}/reviews`).set(CSRF).send({ rating: 5, body: "Lovely strap and finish." });
    assert.equal(res.status, 401);
  });

  it("validates the rating and body", async () => {
    const res = await alice.post(`/api/products/${product.slug}/reviews`).set(CSRF).send({ rating: 9, body: "short" });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details.fields.rating);
    assert.ok(res.body.error.details.fields.body);
  });

  it("stores markup as plain text and updates the product rating", async () => {
    const body = '<img src=x onerror="alert(1)"> Great fit, true to size.';
    const res = await alice.post(`/api/products/${product.slug}/reviews`).set(CSRF).send({ rating: 4, body, userId: "someone-else" });
    assert.equal(res.status, 201);
    assert.equal(res.body.review.body, body, "returned as text; React escapes it on render");
    assert.equal(res.body.review.authorName, "Alice Rao", "author comes from the session, not the body");
    assert.equal(res.body.review.user, undefined, "user id is not exposed");

    const fresh = await Product.findById(product.id);
    assert.equal(fresh.rating, 4);
    assert.equal(fresh.reviewCount, 1);
  });

  it("allows one review per customer per product", async () => {
    const res = await alice.post(`/api/products/${product.slug}/reviews`).set(CSRF).send({ rating: 5, body: "Trying to review twice." });
    assert.equal(res.status, 409);
  });

  it("lists reviews with a star breakdown and the shopper's own review", async () => {
    const res = await alice.get(`/api/products/${product.slug}/reviews`);
    assert.equal(res.status, 200);
    assert.equal(res.body.summary.count, 1);
    assert.deepEqual(res.body.summary.breakdown.find((b) => b.star === 4), { star: 4, count: 1 });
    assert.ok(res.body.mine);
  });

  it("lets only admins moderate reviews", async () => {
    const list = await admin.get("/api/admin/reviews");
    const id = list.body.items[0].id;
    const asCustomer = await alice.delete(`/api/admin/reviews/${id}`).set(CSRF);
    assert.equal(asCustomer.status, 403);
    const asAdmin = await admin.delete(`/api/admin/reviews/${id}`).set(CSRF);
    assert.equal(asAdmin.status, 204);
    const fresh = await Product.findById(product.id);
    assert.equal(fresh.reviewCount, 0);
  });
});

describe("catalogue facets", () => {
  it("lists brands and in-stock sizes in a sensible order", async () => {
    const res = await request().get("/api/products/facets");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.sizes, ["UK 7", "UK 8"]);
    assert.equal(res.body.brands[0].name, "Haldane & Co.");
  });

  it("filters by brand without treating the value as a pattern", async () => {
    const exact = await request().get("/api/products").query({ brand: "Haldane & Co." });
    assert.equal(exact.body.items.length, 1);
    const pattern = await request().get("/api/products").query({ brand: ".*" });
    assert.equal(pattern.body.items.length, 0);
  });
});

describe("wishlist lookups", () => {
  it("returns products by slug and rejects malformed slugs", async () => {
    const ok = await request().get("/api/products").query({ slugs: `${product.slug},missing-one` });
    assert.equal(ok.status, 200);
    assert.deepEqual(ok.body.items.map((p) => p.slug), [product.slug]);
    const bad = await request().get("/api/products").query({ slugs: "a,{$ne:1}" });
    assert.equal(bad.status, 400);
  });
});

describe("newsletter", () => {
  it("validates the email and answers the same way for repeat sign-ups", async () => {
    const bad = await request().post("/api/newsletter").set(CSRF).send({ email: "nope" });
    assert.equal(bad.status, 400);
    const first = await request().post("/api/newsletter").set(CSRF).send({ email: "fan@example.com" });
    const again = await request().post("/api/newsletter").set(CSRF).send({ email: "FAN@example.com" });
    assert.equal(first.status, 201);
    assert.equal(again.status, 201);
    assert.equal(first.body.message, again.body.message);
  });
});
