import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const clientPassword = await argon2.hash('clientPassword');

  const client = await prisma.user.create({
    data: {
      email: 'manriqueacham@gmail.com',
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
