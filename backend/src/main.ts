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
    origin: [
      'https://staysoft.fun',
      'https://api.staysoft.fun',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'], // Importante para expor o token se necessário
  });

  // Listen on 0.0.0.0 to accept connections from outside the container
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
