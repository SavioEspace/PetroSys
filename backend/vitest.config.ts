import {
  defineConfig,
  loadEnv
} from "vite";

export default defineConfig(() => {
  const env =
    loadEnv(
      "test",
      process.cwd(),
      ""
    );

  return {
    test: {
      environment: "node",

      globals: true,

      setupFiles: [
        "./tests/setup.ts"
      ],

      fileParallelism: false,

      testTimeout: 10000,

      hookTimeout: 10000,

      env: {
        NODE_ENV: "test",

        DATABASE_URL:
          env.DATABASE_URL,

        JWT_SECRET:
          env.JWT_SECRET
      }
    }
  };
});