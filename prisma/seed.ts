import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'manriqueacham@gmail.com';

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`El usuario con correo ${email} ya existe`);
    return;
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
