import { z } from "zod";

// Every setting the API reads comes through here, validated once at boot.
// A missing or malformed value stops the process with a readable message
// instead of failing later in the middle of a request.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // Comma-separated list of origins allowed to call the API with credentials.
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  // Set when the API sits behind a proxy (Render, Vercel rewrites) so that
  // rate limiting and secure cookies see the real client IP and protocol.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // "lax" works when the client reaches the API through a same-site proxy
  // (the recommended Vercel rewrite). Use "none" only for a cross-site setup.
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("terrace/products"),

  ANTHROPIC_API_KEY: z.string().optional(),
  CHAT_MODEL: z.string().default("claude-opus-5-5"),

  // Used only by the seed script to create the demo accounts.
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(10).optional(),
  SEED_CUSTOMER_EMAIL: z.string().email().optional(),
  SEED_CUSTOMER_PASSWORD: z.string().min(8).optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${problems}`);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  ...env,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  clientOrigins: env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  cloudinaryEnabled: Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  ),
  chatModelEnabled: Boolean(env.ANTHROPIC_API_KEY),
};
