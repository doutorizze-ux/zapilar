import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { Lead } from '../leads/entities/lead.entity';
import { Event } from '../agenda/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { AiModule } from '../integrations/ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Event, User, Property]),
    AiModule,
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
