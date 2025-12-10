import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead)
        private leadsRepository: Repository<Lead>,
    ) { }

    async upsert(storeId: string, phone: string, message: string, name?: string) {
        let lead = await this.leadsRepository.findOne({ where: { storeId, phone } });

        if (!lead) {
            lead = this.leadsRepository.create({
                storeId,
                phone,
                name,
                lastMessage: message
            });
        } else {
            lead.lastMessage = message;
            if (name) lead.name = name;
        }

        return this.leadsRepository.save(lead);
    }

    async getStats(storeId: string) {
        const totalLeads = await this.leadsRepository.count({ where: { storeId } });
        const recentLeads = await this.leadsRepository.find({
            where: { storeId },
            order: { updatedAt: 'DESC' },
            take: 5
        });

        // Simple mock for "messages count" based on leads activity or separate tracking? 
        // For now, let's return leads count as "active conversations".
        return {
            totalLeads,
            recentLeads
        };
    }

    async findAll(storeId: string): Promise<Lead[]> {
        return this.leadsRepository.find({
            where: { storeId },
            order: { updatedAt: 'DESC' }
        });
    }
}
