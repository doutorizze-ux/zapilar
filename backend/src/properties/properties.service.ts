import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        private usersService: UsersService,
        private plansService: PlansService,
    ) { }

    async create(createPropertyDto: CreatePropertyDto, userId?: string) {
        if (userId) {
            const user = await this.usersService.findById(userId);
            if (user && user.planId) {
                const plan = await this.plansService.findOne(user.planId);

                // If plan has a limit (not null/undefined/0), check it
                if (plan && plan.vehicleLimit !== null && plan.vehicleLimit !== undefined) {
                    const currentCount = await this.propertiesRepository.count({ where: { userId } });

                    // If limit is 0, it might mean unlimited or blocked. Assuming 0 is unlimited or handled elsewhere?
                    // Usually 0 means 'None', -1 or null means 'Unlimited'.
                    // User request said: "value x can put only 10 vehicles... value x can put unlimited".
                    // Let's assume strict limit > 0. If limit is 0, we might want to block or treat as unlimited.
                    // Given the context, usually limit=null is unlimited.
                    // If explicit number, it is the limit.

                    if (plan.vehicleLimit > 0 && currentCount >= plan.vehicleLimit) {
                        throw new BadRequestException(`Limite de imóveis do plano ${plan.name} atingido (${plan.vehicleLimit} imóveis). Faça um upgrade para adicionar mais.`);
                    }
                }
            }
        }

        return this.propertiesRepository.save({ ...createPropertyDto, userId });
    }

    findAll(userId?: string) {
        if (userId) {
            return this.propertiesRepository.find({ where: { userId } });
        }
        return this.propertiesRepository.find();
    }

    findOne(id: string) {
        return this.propertiesRepository.findOne({ where: { id } });
    }

    update(id: string, updatePropertyDto: UpdatePropertyDto) {
        return this.propertiesRepository.update(id, updatePropertyDto);
    }

    remove(id: string) {
        return this.propertiesRepository.delete(id);
    }
}
