import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * The production build is a plain classic script, so docs/index.html opens by double-click
 * (browsers refuse module scripts and CORS-tagged tags on file://) and also works on GitHub Pages.
 */
const openFromDisk = (): Plugin => ({
  name: "open-from-disk",
  apply: "build",
  enforce: "post",
  transformIndexHtml(html) {
    return html.replace(/<script type="module" crossorigin/g, "<script defer").replace(/ crossorigin(?=[ >])/g, "");
  },
});

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), openFromDisk()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: "docs",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: { output: { format: "iife", inlineDynamicImports: true } },
  },
});
