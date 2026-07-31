import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
function releaseIdentifier(mode: string) {
  const explicit = process.env.VITE_APP_REVISION?.trim();
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  const deployment = process.env.VERCEL_DEPLOYMENT_ID?.trim();
  return explicit || commit || deployment || (mode === "production" ? "unattributed-production" : "local");
}

export default defineConfig(({ mode }) => ({
  define: {
    __SCRIMSTATS_RELEASE__: JSON.stringify(releaseIdentifier(mode)),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("d3-")) return "vendor-d3";
          return undefined;
        },
      },
    },
  },
}));
