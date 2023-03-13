import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error(
      'Please provide email and password as command line arguments',
    );
    process.exit(1);
  }

  const clientPassword = await argon2.hash('clientPassword');

  const client = await prisma.user.create({
    data: {
      email: email,
      password: clientPassword,
    },
  });

  console.log({ client });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
