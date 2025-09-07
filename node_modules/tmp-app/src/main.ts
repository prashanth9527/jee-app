import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// Disable SSL certificate verification in development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Allowed origins (both local + production)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rankora.in',
    'https://www.rankora.in',
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean); // remove undefined values

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
    ],
    exposedHeaders: ['Authorization'],
  });

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`✅ API running on http://localhost:${port}`);
  console.log(`✅ CORS enabled for:`, allowedOrigins);
}

bootstrap();
