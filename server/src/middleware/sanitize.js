import { AppError } from "../utils/AppError.js";

const MAX_DEPTH = 8;

// Defence in depth against NoSQL operator injection: refuse any request whose
// body or query contains keys like "$gt" or "a.b". Validation already rejects
// non-primitive values where strings are expected; this catches anything a
// future handler forgets to validate.
function hasUnsafeKey(value, depth = 0) {
  if (depth > MAX_DEPTH) return true;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeKey(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.entries(value).some(
      ([key, nested]) => key.startsWith("$") || key.includes(".") || key === "__proto__" || hasUnsafeKey(nested, depth + 1),
    );
  }
  return false;
}

export function rejectOperatorKeys(req, _res, next) {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query)) {
    return next(AppError.badRequest("The request contains characters that are not allowed.", { code: "UNSAFE_INPUT" }));
  }
  next();
}
