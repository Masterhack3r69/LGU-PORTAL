import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '10.0.0.73',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '10.0.0.73',
    port: 4173,
    strictPort: true,
  },
})
