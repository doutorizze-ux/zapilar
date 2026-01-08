import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
