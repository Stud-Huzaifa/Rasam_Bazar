import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';

function loadRootEnv() {
  const envPath = resolve(process.cwd(), '../../.env');
  const fallbackEnvPath = resolve(process.cwd(), '.env');
  const target = existsSync(envPath) ? envPath : fallbackEnvPath;

  if (!existsSync(target)) {
    return;
  }

  const lines = readFileSync(target, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [rawKey, ...rawValue] = trimmed.split('=');
    const key = rawKey.trim();
    const value = rawValue
      .join('=')
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

function validateEnvironment() {
  const requiredInProduction = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
  ];

  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }
}

validateEnvironment();

const authRateLimitHits = new Map<string, { count: number; resetAt: number }>();

function authRateLimiter(windowMs = 60_000, max = 20) {
  return (req: any, res: any, next: any) => {
    if (!req.path?.startsWith('/api/auth')) {
      next();
      return;
    }

    const now = Date.now();
    const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.path}`;
    const hit = authRateLimitHits.get(key);
    const current =
      hit && hit.resetAt > now ? hit : { count: 0, resetAt: now + windowMs };

    current.count += 1;
    authRateLimitHits.set(key, current);

    if (current.count > max) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      res.status(429).json({
        statusCode: 429,
        message: 'Too many authentication attempts. Please try again shortly.',
      });
      return;
    }

    next();
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(authRateLimiter());
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000';
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? frontendUrl.split(',').map((origin) => origin.trim())
        : true,
    credentials: true,
  });
  app.use((_: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerEnabled =
    process.env.ENABLE_SWAGGER === 'true' ||
    (process.env.NODE_ENV !== 'production' &&
      process.env.ENABLE_SWAGGER !== 'false');

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('RasmBazaar API')
      .setDescription('Desi wedding services marketplace API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(Number(process.env.PORT || 3001), '0.0.0.0');
}

bootstrap();
