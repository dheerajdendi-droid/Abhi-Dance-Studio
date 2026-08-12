import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "server",
          root: "./server",
          environment: "node",
          globals: true,
          setupFiles: ["./test/setupEnv.js"],
          include: ["test/**/*.test.js"],
          fileParallelism: false,
        },
      },
      {
        test: {
          name: "client",
          root: "./client",
          environment: "node",
          include: ["src/**/*.test.js"],
        },
      },
    ],
  },
});
