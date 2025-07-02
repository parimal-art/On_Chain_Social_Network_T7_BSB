import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import fs from "fs";
import path from "path";

dotenv.config({ path: '../../.env' });

const DFX_NETWORK = process.env.DFX_NETWORK || 'local';

function getCanisterIds() {
  try {
    const canisterIdsPath = path.resolve(__dirname, "..", "..", ".dfx", DFX_NETWORK, "canister_ids.json");
    const canisterIds = JSON.parse(fs.readFileSync(canisterIdsPath, "utf8"));
    return {
      backend: canisterIds.On_Chain_Social_Network_T7_BSB_backend.local,
    };
  } catch (error) {
    console.error("Failed to read canister IDs:", error);
    return {};
  }
}

const canisterIds = getCanisterIds();

export default defineConfig({
  base: "/", // Explicitly set base URL
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment({
      DFX_NETWORK,
      BACKEND_CANISTER_ID: canisterIds.backend,
    }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
    dedupe: ['@dfinity/agent'],
  },
});