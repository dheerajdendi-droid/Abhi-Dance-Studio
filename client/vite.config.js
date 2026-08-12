import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Abhi's Dance Studio",
        short_name: "Abhi Dance",
        description: "Attendance & invoicing for Abhi's Dance Studio",
        theme_color: "#3D1F3E",
        background_color: "#FBF6F0",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/(classes|students|settings|dashboard|billing)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-get-cache",
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^\/api\/attendance/,
            method: "POST",
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "attendance-post-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
          {
            urlPattern: /^\/api\/attendance/,
            method: "DELETE",
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "attendance-delete-queue",
                options: { maxRetentionTime: 24 * 60 },
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Both overridable so Playwright's E2E run can boot an isolated
    // client+server pair on separate ports/DB from the normal dev servers.
    port: Number(process.env.VITE_PORT) || 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
