import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // "@" resolves to the project root mirroring tsconfig/Next.js path shorthands.
    alias: { "@": path.dirname(fileURLToPath(import.meta.url)) },
  },
});
