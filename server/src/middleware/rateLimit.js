import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { config } from "../config/env.js";

const shared = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Limits stay on in tests that exercise them; other suites set a high ceiling.
  skip: () => config.isTest && process.env.RATE_LIMIT_TESTS !== "1",
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error: { code: "RATE_LIMITED", message: options.message },
    });
  },
};

export const apiLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 300,
  message: "Too many requests. Please slow down and try again in a minute.",
});

// Brute-force protection for sign in and registration, keyed by IP and email
// so one attacker cannot lock every account and one account cannot be sprayed.
export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? "").toLowerCase()}`,
  message: "Too many attempts. Please wait 15 minutes before trying again.",
});

export const chatLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 15,
  message: "Chotu needs a breather. Try again in a minute.",
});

export const uploadLimiter = rateLimit({
  ...shared,
  windowMs: 10 * 60 * 1000,
  limit: 60,
  message: "Upload limit reached. Try again in a few minutes.",
});
