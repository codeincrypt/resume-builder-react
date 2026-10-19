import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Kept as `build` (rather than Vite's default `dist`) so the existing
    // Netlify publish directory keeps working.
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Firebase and antd are large and change far less often than app
        // code; splitting them out keeps them cached across deploys.
        manualChunks(id: string) {
          // Match on the package name only. Testing the raw id would also
          // match the project directory itself, which is named
          // `resume-builder-react`.
          const marker = "node_modules/";
          const index = id.lastIndexOf(marker);
          if (index === -1) return;
          const pkg = id.slice(index + marker.length);

          if (/^(firebase|@firebase)\//.test(pkg)) return "firebase";
          if (/^(antd|@ant-design|rc-)/.test(pkg)) return "antd";
          if (/^(react|react-dom|scheduler)\//.test(pkg)) return "react";
          if (/^(react-redux|redux|redux-persist|@reduxjs|react-router)/.test(pkg)) {
            return "redux";
          }
        },
      },
    },
  },
});
