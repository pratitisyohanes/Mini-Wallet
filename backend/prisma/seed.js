import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { BCRYPT_SALT_ROUNDS } from '../src/config/constants.js';

const prisma = new PrismaClient();

// Demo accounts for local development only.
const DEMO_PASSWORD = 'password123';
const DEMO_USERS = [
  {
    username: 'pratitis',
    email: 'pratitis@example.com',
    phone: '081200000001',
    balance: 1_000_000n,
    legacyEmail: 'alice@example.com',
  },
  {
    username: 'yohanes',
    email: 'yohanes@example.com',
    phone: '081200000002',
    balance: 500_000n,
    legacyEmail: 'budi@example.com',
  },
];

async function seedUser({ balance, legacyEmail, ...identity }, passwordHash) {
  const existingUser = await prisma.user.findUnique({ where: { email: identity.email } });
  if (existingUser) return;

  // Older seeds created alice/budi with the same phone numbers. Rename those accounts
  // instead of creating new ones, so the unique phone constraint holds and their
  // wallet and transaction history are kept.
  const legacyUser = await prisma.user.findUnique({ where: { email: legacyEmail } });
  if (legacyUser) {
    await prisma.user.update({
      where: { id: legacyUser.id },
      data: { username: identity.username, email: identity.email, passwordHash },
    });
    return;
  }

  await prisma.user.create({
    data: {
      ...identity,
      passwordHash,
      wallet: {
        create: {
          balance,
          transactions: {
            create: {
              type: 'TOPUP',
              amount: balance,
              balanceBefore: 0n,
              balanceAfter: balance,
              referenceId: crypto.randomUUID(),
              description: 'Saldo awal',
            },
          },
        },
      },
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_SALT_ROUNDS);

  for (const user of DEMO_USERS) {
    await seedUser(user, passwordHash);
  }

  console.log(`Seeded ${DEMO_USERS.length} demo users (password: ${DEMO_PASSWORD}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
