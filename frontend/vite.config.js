import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige cualquier petición que empiece con /api a nuestro backend
      "/api": {
        target: "http://localhost:3001", // La URL de tu servidor backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
