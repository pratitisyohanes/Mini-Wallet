import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

const testEnv = dotenv.config({ path: '.env.test' }).parsed ?? {};

export default defineConfig({
  test: {
    // A fake sandbox key enables the Midtrans code paths. Tests mock every call to Midtrans.
    env: { NODE_ENV: 'test', MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-key', ...testEnv },
    globalSetup: './tests/globalSetup.js',
    // Integration tests share one database, so files must not run in parallel.
    fileParallelism: false,
  },
});
