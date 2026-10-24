import { config } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { createApp } from "./app.js";

async function main() {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    console.log(`Terrace API listening on http://localhost:${config.PORT}`);
    console.log(`  images: ${config.cloudinaryEnabled ? "Cloudinary" : "local disk (development)"}`);
    console.log(`  assistant: ${config.chatModelEnabled ? config.CHAT_MODEL : "rule-based (no ANTHROPIC_API_KEY)"}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Failed to start the API:", error.message);
  process.exit(1);
});
