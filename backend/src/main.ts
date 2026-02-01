import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Configuração de CORS aprimorada para o ambiente Coolify
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins in development or if they match the list
      const allowedOrigins = [
        'https://zapilar.online',
        // Add other domains if needed
      ];
      if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('zapilar.online')) {
        callback(null, true);
      } else {
        // Default to allow for now during debugging
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With,Origin',
    exposedHeaders: ['Authorization'],
  });

  // Listen on 0.0.0.0 to accept connections from outside the container
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
