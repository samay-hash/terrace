import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { config } from "./config/env.js";
import { router } from "./routes/index.js";
import { authenticate } from "./middleware/auth.js";
import { requireCsrfHeader, CSRF_HEADER } from "./middleware/csrf.js";
import { rejectOperatorKeys } from "./middleware/sanitize.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { LOCAL_UPLOAD_DIR } from "./services/imageStorage.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);
  // No nested objects from the query string (`?price[$gt]=0` stays a literal
  // key), which closes the most common NoSQL injection route.
  app.set("query parser", "simple");

  // The API only serves JSON, so the strictest CSP applies.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and server-to-server requests have no Origin header.
        if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", CSRF_HEADER],
      maxAge: 600,
    }),
  );

  app.use(compression());
  if (!config.isTest) app.use(morgan(config.isProduction ? "combined" : "dev"));

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Development-only image store (production uses Cloudinary).
  if (!config.cloudinaryEnabled && !config.isProduction) {
    app.use("/uploads", express.static(LOCAL_UPLOAD_DIR, { maxAge: "7d", immutable: true, index: false }));
  }

  app.use("/api", apiLimiter, rejectOperatorKeys, requireCsrfHeader, authenticate, router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
