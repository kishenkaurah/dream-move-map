// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Load all non-VITE_ env vars into process.env for server routes (e.g.,
    // SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY). The framework's VITE_ load
    // stays intact for client code.
    plugins: [
      {
        name: "load-server-env",
        config(_, { mode }) {
          const serverEnv = loadServerEnv(mode);
          Object.assign(process.env, serverEnv);
          return {};
        },
      },
    ],
    resolve: {
      alias: {
        // React Email/htmlparser2 needs entities v4.5.0. Bun may install a
        // nested v7+ copy that lacks ./lib/decode.js; force all imports to
        // the hoisted v4.5.0 copy.
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

function loadServerEnv(mode: string) {
  // Vite's loadEnv is not exported in all versions; fall back to manual dotenv if needed.
  try {
    const { loadEnv } = require("vite");
    return loadEnv(mode, process.cwd(), "");
  } catch {
    return {};
  }
}
