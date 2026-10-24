import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { clearSession, issueSession } from "../middleware/auth.js";

export async function register(req, res) {
  const { name, email, password } = req.valid.body;

  if (await User.exists({ email })) {
    throw AppError.conflict("An account with this email already exists. Try signing in instead.", {
      code: "EMAIL_TAKEN",
      details: { fields: { email: "This email is already registered." } },
    });
  }

  const user = new User({ name, email, role: "customer" });
  await user.setPassword(password);
  user.lastLoginAt = new Date();
  await user.save();

  issueSession(res, user);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+passwordHash +tokenVersion");

  // Same message and similar timing for "no such account" and "wrong password",
  // so the form cannot be used to discover which emails are registered.
  const valid = user ? await user.verifyPassword(password) : await User.burnPasswordCheck(password);
  if (!user || !valid) {
    throw new AppError(401, "Email or password is incorrect.", { code: "INVALID_CREDENTIALS" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  issueSession(res, user);
  res.json({ user });
}

export function logout(_req, res) {
  clearSession(res);
  res.status(204).end();
}

export function me(req, res) {
  res.json({ user: req.user ?? null });
}
