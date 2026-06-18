import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Move core framework dependencies into a small, long-term cached bundle
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "vendor-core";
          }
          // Move icons or visual UI frameworks to their own chunks
          if (id.includes("node_modules/@mui/") || id.includes("material")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
});
