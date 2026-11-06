import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

export default function setup() {
  const testEnv = dotenv.config({ path: '.env.test' }).parsed;

  if (!testEnv?.DATABASE_URL) {
    throw new Error('Create backend/.env.test (see .env.test.example) with a separate test DATABASE_URL.');
  }

  // Tests truncate every table, so refuse to run against a database that is not clearly a test one.
  if (!/test/i.test(new URL(testEnv.DATABASE_URL).pathname)) {
    throw new Error('The test DATABASE_URL must point to a database whose name contains "test".');
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testEnv.DATABASE_URL },
    stdio: 'inherit',
  });
}
