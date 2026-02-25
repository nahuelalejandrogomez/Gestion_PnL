import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Orígenes CORS permitidos por ambiente.
// NODE_ENV debe setearse en Railway por servicio (production / staging).
// En desarrollo local se permiten los puertos habituales de Vite y Angular.
const CORS_ORIGINS: Record<string, string[]> = {
  production: ['https://frontend-production-d65e.up.railway.app'],
  staging:    ['https://frontend-staging-4036.up.railway.app'],
};
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4200',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const env = process.env.NODE_ENV ?? 'development';
  const allowedOrigins = CORS_ORIGINS[env] ?? DEFAULT_ORIGINS;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on port ${port} [NODE_ENV=${env}]`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
