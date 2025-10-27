import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  VitePWA({
    strategies: "injectManifest",
    srcDir: "src",
    filename: "service-worker.ts",
    registerType: "autoUpdate",
    includeAssets: [
      "favicon.ico",
      "apple-touch-icon.png",
      "pwa-icon-192.png",
      "pwa-icon-512.png",
      "pwa-icon-maskable-512.png",
      "notification-icon-192.png",
      "notification-badge-256.png",
    ],
    manifest: {
      id: "/",
      name: "Gold Tracker",
      short_name: "GoldTracker",
      description: "An application to track gold and silver prices and purchases.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      theme_color: "#0f172a",
      background_color: "#0f172a",
      categories: ["finance", "productivity"],
      icons: [
        {
          src: "pwa-icon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-icon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "pwa-icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    injectManifest: {
      globPatterns: ["index.html", "**/*.{js,css,ico,png,svg,webp,woff2,webmanifest}"],
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  }),
];

const packageJson = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false, // Ensure sourcemaps are not generated for production
    // Consider using dynamic imports (lazy loading) for routes and components
    // to further reduce initial JavaScript bundle size.
    // Example: const MyComponent = lazy(() => import('./MyComponent'));
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
