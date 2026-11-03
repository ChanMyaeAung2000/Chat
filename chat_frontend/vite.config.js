import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Backend origin the dev server should proxy to (not exposed to the browser bundle).
  const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:5001";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      // Browser talks same-origin to :5173; Vite forwards API + WebSocket
      // traffic to the backend — no CORS in development.
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
