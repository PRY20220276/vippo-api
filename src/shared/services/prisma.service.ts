import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    if (process.env.NODE_ENV === 'production') {
      await this.runMigrationsAndSeed();
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  async runMigrationsAndSeed() {
    // Run migrations
    execSync('npx prisma migrate deploy');

    // Seed the database
    execSync('ts-node prisma/seed.ts');
  }
}
