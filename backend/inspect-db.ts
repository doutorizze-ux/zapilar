import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Property } from './src/properties/entities/property.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const repo = app.get(getRepositoryToken(Property));
    const properties = await repo.find();
    console.log('--- PROPERTIES ---');
    properties.forEach((p: any) => {
        console.log(`ID: ${p.id} | Title: ${p.title} | isSold: ${p.isSold} (Type: ${typeof p.isSold})`);
    });
    await app.close();
}
bootstrap();
