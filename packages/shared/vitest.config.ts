import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib/navigator": path.resolve(__dirname, "navigator"),
      "@/lib/article-framework": path.resolve(__dirname, "peaf"),
      "@/data/mock_knowledge_base": path.resolve(
        __dirname,
        "navigator/__tests__/mock_knowledge_base",
      ),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
  },
});
