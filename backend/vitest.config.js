import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

const testEnv = dotenv.config({ path: '.env.test' }).parsed ?? {};

export default defineConfig({
  test: {
    env: { NODE_ENV: 'test', ...testEnv },
    globalSetup: './tests/globalSetup.js',
    // Integration tests share one database, so files must not run in parallel.
    fileParallelism: false,
  },
});
