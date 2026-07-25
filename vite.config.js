import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// Modern field Chrome / WebView — drop legacy polyfill weight (M-05).
const BUILD_TARGET = ["es2020", "chrome90", "safari14", "firefox90"];

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
      },
      manifest: {
        name: "Admin Panel",
        short_name: "Admin",
        description: "Admin Panel",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0ea5e9",
        background_color: "#f8fafc",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Keep large hero video out of precache; logos/webm still optional via runtime.
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2,webp}"],
        globIgnores: ["**/hero-*.{mp4,webm}", "**/herobgvideofinal.mp4"],
      },
    }),
    mode === "analyze" &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ].filter(Boolean),
  build: {
    target: BUILD_TARGET,
    cssTarget: "chrome90",
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return;
          // Keep React/Redux split; do NOT force-chunk antd here — dynamic
          // import("antd") already creates an async chunk. Forcing antd +
          // @rc-component into one manual chunk absorbs shared deps that the
          // entry then statically imports (esp. on Windows path quirks).
          if (
            /\/node_modules\/(react-dom|scheduler)\//.test(normalized) ||
            /\/node_modules\/react\//.test(normalized) ||
            /\/node_modules\/react-router\//.test(normalized)
          ) {
            return "react-vendor";
          }
          if (
            /\/node_modules\/@reduxjs\//.test(normalized) ||
            /\/node_modules\/redux\//.test(normalized) ||
            /\/node_modules\/redux-persist\//.test(normalized)
          ) {
            return "redux";
          }
        },
      },
    },
  },
  // Note: No proxy needed for serverless Lambda backend
  // Set VITE_API_BASE_URL in .env to your API Gateway URL
}));
