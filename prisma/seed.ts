import 'dotenv/config';
import { Role } from '@prisma/client';
import { prisma } from '../server/db';
import { hashPassword } from '../server/auth/password';

async function main() {
  const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_OWNER_PASSWORD;
  if (!email || !password) {
    console.info('Owner bootstrap skipped; no owner credentials were configured.');
    return;
  }
  if (password.length < 16) throw new Error('BOOTSTRAP_OWNER_PASSWORD must contain at least 16 characters');
  const existingOwner = await prisma.user.findFirst({ where: { role: Role.OWNER } });
  if (existingOwner) {
    console.info('Owner bootstrap skipped; an owner account already exists.');
    return;
  }
  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { email, fullName: 'SiHub Owner', passwordHash, role: Role.OWNER } });
  console.info('Initial owner account created.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
