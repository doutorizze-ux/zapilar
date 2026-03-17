import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { PropertiesModule } from '../properties/properties.module';
import { WhatsappController } from './whatsapp.controller';
import { UsersModule } from '../users/users.module';
import { FaqModule } from '../faq/faq.module';
import { LeadsModule } from '../leads/leads.module';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { AiModule } from '../integrations/ai/ai.module';
import { AgendaModule } from '../agenda/agenda.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    PropertiesModule,
    UsersModule,
    FaqModule,
    LeadsModule,
    AiModule,
    AgendaModule,
  ],
  providers: [WhatsappService, ChatGateway],
  exports: [WhatsappService, ChatGateway],
  controllers: [WhatsappController],
})
export class WhatsappModule {}
