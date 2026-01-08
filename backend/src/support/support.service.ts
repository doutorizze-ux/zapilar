import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private repo: Repository<SupportTicket>,
  ) {}

  async create(dto: CreateSupportTicketDto) {
    const ticket = this.repo.create(dto);
    return this.repo.save(ticket);
  }

  async findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: TicketStatus) {
    await this.repo.update(id, { status });
    return this.repo.findOneBy({ id });
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }
}
