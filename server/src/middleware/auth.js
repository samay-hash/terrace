import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const SESSION_COOKIE = "terrace_session";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript, so XSS cannot steal it
    secure: config.isProduction || config.COOKIE_SAMESITE === "none",
    sameSite: config.COOKIE_SAMESITE,
    path: "/",
  };
}

export function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id, ver: user.tokenVersion ?? 0 }, config.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: config.JWT_EXPIRES_IN,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

// Resolves the signed-in user, if any, and attaches it to req.user. The role
// is always read from the database, never from the token, so a demoted or
// deleted account loses access immediately.
export async function authenticate(req, _res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();

  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return next(); // expired or tampered: treat as signed out
  }

  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (user && user.tokenVersion === payload.ver) {
    req.user = user;
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(AppError.unauthorized());
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
}
