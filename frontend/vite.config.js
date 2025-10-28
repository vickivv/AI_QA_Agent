import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["pyodide"], // 👈 prevents Vite from pre-bundling Pyodide
  },
});

