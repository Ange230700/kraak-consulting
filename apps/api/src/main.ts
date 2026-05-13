import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildCorsOptions } from './cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  app.enableCors(
    buildCorsOptions({
      CORS_ALLOWED_ORIGINS: process.env['CORS_ALLOWED_ORIGINS'],
      CORS_ALLOWED_ORIGIN_PATTERNS: process.env['CORS_ALLOWED_ORIGIN_PATTERNS'],
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KRAAK API')
    .setDescription(
      'API backend du projet KRAAK â€” formation, gestion de projet et conseil en immigration.',
    )
    .setVersion('0.1.0')
    .addTag('Health', "Vérification de l'état de l'API")
    .addTag('Auth', 'Authentification, session et récupération de compte')
    .addTag('Support', 'Formulaire de contact et demandes de support')
    .addTag(
      'Announcements',
      'Annonces publiées accessibles aux participants selon leur périmètre',
    )
    .addTag(
      'Programs',
      'Programmes participants, détail des sessions et progression minimale',
    )
    .addTag(
      'Dashboard',
      'Agrégat dashboard participant (programmes, sessions à venir, annonces)',
    )
    .addTag(
      'Resources',
      'Ressources publiées (liste, détail, suivi des consultations)',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

bootstrap();
