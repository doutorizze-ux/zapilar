import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
  ) {}

  async create(storeId: string, dto: any) {
    return this.upsert(
      storeId,
      dto.phone,
      dto.description || 'Lead Manual',
      dto.name,
    );
  }

  async upsert(storeId: string, phone: string, message: string, name?: string) {
    let lead = await this.leadsRepository.findOne({
      where: { storeId, phone },
    });

    if (!lead) {
      lead = this.leadsRepository.create({
        storeId,
        phone,
        name,
        lastMessage: message,
        isHot: this.checkHotLead(message),
        interestSubject: undefined,
      });
    } else {
      lead.lastMessage = message;
      const isHotNow = this.checkHotLead(message);
      if (isHotNow) lead.isHot = true; // Only upgrade to hot, never downgrade automatically
      if (name) lead.name = name;
    }

    return this.leadsRepository.save(lead);
  }

  private checkHotLead(message: string): boolean {
    const keywords = [
      'price',
      'financing',
      'installments',
      'entrada',
      'parcelas',
      'permuta',
      'troca',
      'financiamento',
      'visita',
      'valor',
      'preço',
    ];
    const lower = message.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  }

  async setInterest(storeId: string, phone: string, interest: string) {
    const lead = await this.leadsRepository.findOne({
      where: { storeId, phone },
    });
    if (lead) {
      lead.interestSubject = interest;
      return this.leadsRepository.save(lead);
    }
    return null;
  }

  async updateQualification(
    storeId: string,
    phone: string,
    data: Partial<Lead>,
  ) {
    const lead = await this.leadsRepository.findOne({
      where: { storeId, phone },
    });
    if (lead) {
      Object.assign(lead, data);
      return this.leadsRepository.save(lead);
    }
  }

  async getStats(storeId: string) {
    const totalLeads = await this.leadsRepository.count({ where: { storeId } });
    const recentLeads = await this.leadsRepository.find({
      where: { storeId },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    // Simple mock for "messages count" based on leads activity or separate tracking?
    // For now, let's return leads count as "active conversations".
    return {
      totalLeads,
      recentLeads,
    };
  }

  async findAll(storeId: string): Promise<Lead[]> {
    return this.leadsRepository.find({
      where: { storeId },
      order: { updatedAt: 'DESC' },
    });
  }

  async remove(id: string, storeId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id, storeId } });
    if (lead) {
      return this.leadsRepository.remove(lead);
    }
    return null;
  }
}
