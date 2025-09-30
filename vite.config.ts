import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const crossOriginHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "fetch-retry": "fetch-retry/index.js",
      stream: "stream-browserify",
      buffer: "buffer",
      util: "util/",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    exclude: ["@zama-fhe/relayer-sdk/web"],
    include: ["keccak", "bigint-buffer", "stream", "buffer", "util", "process/browser"],
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  worker: {
    format: "es",
  },
  server: {
    headers: crossOriginHeaders,
  },
  preview: {
    headers: crossOriginHeaders,
  },
});
