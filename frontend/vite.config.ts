import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// ✅ Must exactly match your GitHub repo name
const REPO_NAME = "/shakespeare-text-generator";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? REPO_NAME + "/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));