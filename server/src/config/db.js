import mongoose from "mongoose";
import { config } from "./env.js";

// Query filters are only ever built from zod-validated values (strings,
// numbers, enums), and middleware/sanitize.js rejects "$" keys as a second
// line of defence, so { "email": { "$ne": null } } never reaches a query.
mongoose.set("strictQuery", true);

export async function connectDatabase(uri = config.MONGODB_URI) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
