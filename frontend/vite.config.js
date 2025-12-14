import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5174,
      // Ensure the client connects to the Vite dev server's websocket
      // even if the page is loaded through a proxy or different origin.
      clientPort: 5174,
    },
    proxy: {
      // Proxy API requests to backend (running on 5173)
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy socket.io websocket to backend
      "/socket.io": {
        target: "http://localhost:5000  ",
        ws: true,
      },
    },
  },
});
