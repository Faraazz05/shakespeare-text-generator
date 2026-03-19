import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// ✅ Replace YOUR_REPO_NAME with your actual GitHub repo name
// e.g. if your repo is github.com/faraz/hybrid-text-gen → base: "/hybrid-text-gen/"
const REPO_NAME = "/hybrid-text-gen/";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? REPO_NAME : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
