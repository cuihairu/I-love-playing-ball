import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@i-love-playing-ball/game-config": fileURLToPath(
        new URL("../../packages/game-config/src/index.ts", import.meta.url)
      ),
      "@i-love-playing-ball/platform-sdk": fileURLToPath(
        new URL("../../packages/platform-sdk/src/index.ts", import.meta.url)
      )
    }
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/example.ts", "src/example-online.ts", "src/cocos-flow-demo.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80
      }
    }
  }
});
