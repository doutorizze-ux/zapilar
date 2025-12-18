import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class AgendaService {
    constructor(
        @InjectRepository(Event)
        private repo: Repository<Event>,
    ) { }

    create(userId: string, dto: CreateEventDto) {
        const event = this.repo.create({ ...dto, userId });
        return this.repo.save(event);
    }

    findAll(userId: string) {
        return this.repo.find({
            where: { userId },
            order: { start: 'ASC' }
        });
    }

    update(id: string, userId: string, dto: CreateEventDto) {
        return this.repo.update({ id, userId }, dto);
    }

    remove(id: string, userId: string) {
        return this.repo.delete({ id, userId });
    }
}
