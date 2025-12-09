import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WhatsappController } from './whatsapp.controller';
import { UsersModule } from '../users/users.module';
import { FaqModule } from '../faq/faq.module';

import { LeadsModule } from '../leads/leads.module';

@Module({
    imports: [VehiclesModule, UsersModule, FaqModule, LeadsModule],
    providers: [WhatsappService],
    exports: [WhatsappService],
    controllers: [WhatsappController],
})
export class WhatsappModule { }
