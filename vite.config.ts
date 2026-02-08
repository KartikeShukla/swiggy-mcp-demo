import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { oauthPlugin } from "./server/oauth-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), oauthPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
