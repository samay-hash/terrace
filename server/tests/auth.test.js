import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { CSRF, User, createUser, request, setupDatabase, signedInAgent, teardownDatabase } from "./helpers.js";

before(setupDatabase);
after(teardownDatabase);

describe("registration", () => {
  it("creates a customer, hashes the password and sets an httpOnly session cookie", async () => {
    const res = await request()
      .post("/api/auth/register")
      .set(CSRF)
      .send({ name: "Asha Rao", email: "Asha@Example.com", password: "Kickoff2026" });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "asha@example.com");
    assert.equal(res.body.user.passwordHash, undefined, "hash must never be returned");

    const cookie = res.headers["set-cookie"].find((c) => c.startsWith("terrace_session="));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);

    const stored = await User.findOne({ email: "asha@example.com" }).select("+passwordHash");
    assert.match(stored.passwordHash, /^\$2[aby]\$12\$/, "bcrypt with cost 12");
    assert.notEqual(stored.passwordHash, "Kickoff2026");
  });

  it("ignores a role sent by the client (no self-registration as admin)", async () => {
    const res = await request()
      .post("/api/auth/register")
      .set(CSRF)
      .send({ name: "Sneaky", email: "sneaky@example.com", password: "Kickoff2026", role: "admin" });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, "customer");
  });

  it("rejects weak passwords and invalid emails with field messages", async () => {
    const res = await request().post("/api/auth/register").set(CSRF).send({ name: "A", email: "not-an-email", password: "short" });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.ok(res.body.error.details.fields.email);
    assert.ok(res.body.error.details.fields.password);
    assert.ok(res.body.error.details.fields.name);
  });

  it("refuses a duplicate email with 409", async () => {
    const res = await request().post("/api/auth/register").set(CSRF).send({ name: "Asha Again", email: "asha@example.com", password: "Kickoff2026" });
    assert.equal(res.status, 409);
  });
});

describe("login", () => {
  before(() => createUser({ email: "fan@example.com" }));

  it("uses one generic message for unknown email and wrong password", async () => {
    const wrongPassword = await request().post("/api/auth/login").set(CSRF).send({ email: "fan@example.com", password: "nope" });
    const unknownEmail = await request().post("/api/auth/login").set(CSRF).send({ email: "ghost@example.com", password: "nope" });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
  });

  it("blocks NoSQL operator injection in the login body", async () => {
    const res = await request().post("/api/auth/login").set(CSRF).send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });

  it("signs in, reports the user from /me and signs out", async () => {
    const agent = await signedInAgent("fan@example.com");
    const me = await agent.get("/api/auth/me");
    assert.equal(me.body.user.email, "fan@example.com");

    const out = await agent.post("/api/auth/logout").set(CSRF);
    assert.equal(out.status, 204);
    const after = await agent.get("/api/auth/me");
    assert.equal(after.body.user, null);
  });
});

describe("session tokens", () => {
  it("treats a token signed with another secret as signed out", async () => {
    const user = await User.findOne({ email: "fan@example.com" });
    const forged = jwt.sign({ sub: user.id, ver: 0 }, "attacker-secret-attacker-secret-123456");
    const res = await request().get("/api/auth/me").set("Cookie", `terrace_session=${forged}`);
    assert.equal(res.body.user, null);
  });

  it("rejects the 'none' algorithm", async () => {
    const user = await User.findOne({ email: "fan@example.com" });
    const unsigned = jwt.sign({ sub: user.id, ver: 0 }, null, { algorithm: "none" });
    const res = await request().get("/api/cart").set("Cookie", `terrace_session=${unsigned}`);
    assert.equal(res.status, 401);
  });

  it("invalidates existing sessions when tokenVersion is bumped", async () => {
    const agent = await signedInAgent("fan@example.com");
    await User.updateOne({ email: "fan@example.com" }, { $inc: { tokenVersion: 1 } });
    const res = await agent.get("/api/cart");
    assert.equal(res.status, 401);
  });
});

describe("CSRF protection", () => {
  it("refuses state-changing requests without the client header", async () => {
    const res = await request().post("/api/auth/login").send({ email: "fan@example.com", password: "Password123" });
    assert.equal(res.status, 403);
  });
});
