import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { PropertiesModule } from './properties/properties.module';
import { PlansModule } from './plans/plans.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AuthModule } from './auth/auth.module';
import { AsaasModule } from './integrations/asaas/asaas.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FaqModule } from './faq/faq.module';
import { LeadsModule } from './leads/leads.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SupportModule } from './support/support.module';
import { ContactsModule } from './contacts/contacts.module';
import { FinancialModule } from './financial/financial.module';
import { AgendaModule } from './agenda/agenda.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: process.env.DATABASE_PATH || 'zapilar_v3.db',
        autoLoadEntities: true,
        synchronize: true, // Use carefully in production
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    UsersModule,
    StoresModule,
    PropertiesModule,
    PlansModule,
    WhatsappModule,
    AuthModule,
    AsaasModule,
    SubscriptionsModule,
    FaqModule,
    LeadsModule,
    DashboardModule,
    SupportModule,
    ContactsModule,
    FinancialModule,
    AgendaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
