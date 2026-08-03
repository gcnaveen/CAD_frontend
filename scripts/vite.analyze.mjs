import { defineConfig, mergeConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import base from "../vite.config.js";

// One-off analyze config — does not mutate vite.config.js
export default defineConfig(async (env) => {
  const resolved = typeof base === "function" ? await base({ ...env, mode: "analyze" }) : base;
  return mergeConfig(resolved, {
    plugins: [
      visualizer({
        filename: "dist/stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
      visualizer({
        filename: "dist/stats.json",
        template: "raw-data",
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ],
  });
});
