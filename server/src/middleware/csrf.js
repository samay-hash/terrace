import { AppError } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const CSRF_HEADER = "x-requested-with";
export const CSRF_VALUE = "terrace";

// The session cookie is SameSite, and on top of that every state-changing
// request must carry a custom header. Browsers will not attach a custom header
// to a cross-site request without a CORS preflight, and our CORS policy only
// allows the storefront origin, so a forged form post from another site fails.
export function requireCsrfHeader(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get(CSRF_HEADER) !== CSRF_VALUE) {
    return next(AppError.forbidden("Request blocked: missing client header."));
  }
  next();
}
