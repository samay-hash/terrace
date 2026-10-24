import mongoose from "mongoose";
import multer from "multer";
import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { MAX_IMAGE_BYTES, MAX_IMAGES_PER_REQUEST } from "./upload.js";

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`No route for ${req.method} ${req.path}`));
}

// Maps every error to a status code and a message that is safe to show.
// Stack traces and driver messages are logged on the server only.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const normalized = normalize(err);

  if (normalized.status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  });
}

function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `Each image must be ${MAX_IMAGE_BYTES / 1024 / 1024} MB or smaller.`,
      LIMIT_FILE_COUNT: `Upload up to ${MAX_IMAGES_PER_REQUEST} images at a time.`,
      LIMIT_UNEXPECTED_FILE: 'Send images in the "images" field.',
    };
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return new AppError(status, messages[err.code] ?? "The upload could not be read.", { code: err.code });
  }

  if (err instanceof mongoose.Error.CastError) {
    return AppError.badRequest("One of the ids in this request is not valid.", { code: "INVALID_ID" });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fields = Object.fromEntries(Object.entries(err.errors).map(([key, value]) => [key, value.message]));
    return AppError.badRequest("Some fields need attention.", { code: "VALIDATION_ERROR", details: { fields } });
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "value";
    return AppError.conflict(`That ${field} is already in use.`, { code: "DUPLICATE" });
  }

  if (err?.type === "entity.too.large") {
    return new AppError(413, "The request body is too large.", { code: "PAYLOAD_TOO_LARGE" });
  }

  if (err?.type === "entity.parse.failed") {
    return AppError.badRequest("The request body is not valid JSON.", { code: "INVALID_JSON" });
  }

  if (err instanceof mongoose.Error.MongooseServerSelectionError || err?.name === "MongoNetworkError") {
    return new AppError(503, "The store is temporarily unavailable. Please try again shortly.", { code: "DB_UNAVAILABLE" });
  }

  return new AppError(500, config.isProduction ? "Something went wrong on our side." : err?.message || "Unexpected error", {
    code: "INTERNAL_ERROR",
  });
}
