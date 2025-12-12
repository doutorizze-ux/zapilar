import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WhatsappController } from './whatsapp.controller';
import { UsersModule } from '../users/users.module';
import { FaqModule } from '../faq/faq.module';
import { HttpModule } from '@nestjs/axios';
import { LeadsModule } from '../leads/leads.module';

import { ChatGateway } from './chat.gateway';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatMessage]),
        HttpModule,
        VehiclesModule, UsersModule, FaqModule, LeadsModule
    ],
    providers: [WhatsappService, ChatGateway],
    exports: [WhatsappService, ChatGateway],
    controllers: [WhatsappController],
})
export class WhatsappModule { }
