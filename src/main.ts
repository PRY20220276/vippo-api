import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Versioning
  app.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  });
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('VIPPO REST API')
    .setDescription('AI Tool Video Generation')
    .setVersion('1.0')
    .setContact(
      'Marco Manrique A.',
      'https://github.com/MarcoMnrq',
      'manriqueacham@gmail.com',
    )
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  // Start application
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
