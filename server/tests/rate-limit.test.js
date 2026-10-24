import { after, before, it } from "node:test";
import assert from "node:assert/strict";
import { CSRF, createUser, request, setupDatabase, teardownDatabase } from "./helpers.js";

// Rate limits are skipped in the other suites; this one turns them on.
before(async () => {
  process.env.RATE_LIMIT_TESTS = "1";
  await setupDatabase();
  await createUser({ email: "target@example.com" });
});
after(async () => {
  delete process.env.RATE_LIMIT_TESTS;
  await teardownDatabase();
});

it("locks out repeated failed sign-ins for an account with 429", async () => {
  const attempts = [];
  for (let i = 0; i < 11; i += 1) {
    attempts.push(await request().post("/api/auth/login").set(CSRF).send({ email: "target@example.com", password: `guess-${i}` }));
  }
  assert.deepEqual(
    attempts.slice(0, 10).map((r) => r.status),
    Array(10).fill(401),
  );
  assert.equal(attempts[10].status, 429);
  assert.equal(attempts[10].body.error.code, "RATE_LIMITED");
});
