import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development the API runs on :4000. Proxying keeps the browser on a
// single origin, exactly like the production Vercel rewrite, so the session
// cookie stays first-party and SameSite=Lax works the same in both.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
