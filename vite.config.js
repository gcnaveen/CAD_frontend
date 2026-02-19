import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Note: No proxy needed for serverless Lambda backend
  // Set VITE_API_BASE_URL in .env to your API Gateway URL
});
