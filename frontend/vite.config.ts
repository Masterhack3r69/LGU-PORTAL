import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

// HTTPS configuration
const httpsConfig = () => {
  if (process.env.VITE_HTTPS !== 'true') return false;
  
  const keyPath = path.resolve(__dirname, 'certs/key.pem');
  const certPath = path.resolve(__dirname, 'certs/cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  
  console.warn('⚠️  HTTPS enabled but certificates not found. Run: node generate-cert.js');
  return true; // Use Vite's built-in self-signed cert
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    https: httpsConfig(),
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true,
    https: httpsConfig(),
  },
})
