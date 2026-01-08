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
                if (plan && plan.propertyLimit !== null && plan.propertyLimit !== undefined) {
                    const currentCount = await this.propertiesRepository.count({ where: { userId } });

                    if (plan.propertyLimit > 0 && currentCount >= plan.propertyLimit) {
                        throw new BadRequestException(`Limite de imóveis do plano ${plan.name} atingido (${plan.propertyLimit} imóveis). Faça um upgrade para adicionar mais.`);
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

    async getCities(userId: string): Promise<string[]> {
        const result = await this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.city', 'city')
            .where('property.userId = :userId', { userId })
            .andWhere('property.city IS NOT NULL')
            .andWhere("property.city != ''")
            .orderBy('property.city', 'ASC')
            .getRawMany();

        if (result.length > 0) {
            return result.map(r => r.city);
        }

        // Fallback: Try to use 'location' field if 'city' is empty (Legacy Data Support)
        const legacyResult = await this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.location', 'location')
            .where('property.userId = :userId', { userId })
            .andWhere('property.location IS NOT NULL')
            .andWhere("property.location != ''")
            .getRawMany();

        // extract potential cities from location strings (naive approach)
        const cities = new Set<string>();
        legacyResult.forEach(r => {
            if (r.location) {
                // assume format "Neighborhood, City" or try to just use the whole string
                const parts = r.location.split(',');
                if (parts.length > 1) {
                    cities.add(parts[parts.length - 1].trim());
                } else {
                    cities.add(r.location.trim());
                }
            }
        });

        return Array.from(cities).sort();
    }

    async getPropertyTypes(userId: string, city: string): Promise<string[]> {
        const result = await this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.type', 'type')
            .where('property.userId = :userId', { userId })
            .andWhere('property.city = :city', { city })
            .andWhere('property.type IS NOT NULL')
            .orderBy('property.type', 'ASC')
            .getRawMany();

        if (result.length > 0) {
            return result.map(r => r.type);
        }

        // Fallback for legacy data (try to guess type from legacy location?? No, Type is usually set properly)
        // If Type is set but City is not (legacy fallback)
        const legacyResult = await this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.type', 'type')
            .where('property.userId = :userId', { userId })
            .andWhere('property.location LIKE :cityLike', { cityLike: `%${city}%` })
            .andWhere('property.type IS NOT NULL')
            .getRawMany();

        return legacyResult.map(r => r.type).sort();
    }

    async getNeighborhoods(userId: string, city: string, type?: string): Promise<string[]> {
        const query = this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.neighborhood', 'neighborhood')
            .where('property.userId = :userId', { userId })
            .andWhere('property.city = :city', { city })
            .andWhere('property.neighborhood IS NOT NULL')
            .andWhere("property.neighborhood != ''");

        if (type) {
            query.andWhere('property.type = :type', { type });
        }

        const result = await query.orderBy('property.neighborhood', 'ASC').getRawMany();

        if (result.length > 0) {
            return result.map(r => r.neighborhood);
        }

        // Fallback: legacy location
        const legacyQuery = this.propertiesRepository
            .createQueryBuilder('property')
            .select('DISTINCT property.location', 'location')
            .where('property.userId = :userId', { userId })
            .andWhere('property.location LIKE :cityLike', { cityLike: `%${city}%` });

        if (type) {
            legacyQuery.andWhere('property.type = :type', { type });
        }

        const legacyResult = await legacyQuery.getRawMany();

        const neighborhoods = new Set<string>();
        legacyResult.forEach(r => {
            if (r.location) {
                // Try to remove city from string to find neighborhood
                // "Bairro, City"
                const parts = r.location.split(',');
                if (parts.length > 1) {
                    neighborhoods.add(parts[0].trim());
                } else {
                    neighborhoods.add(r.location.trim()); // Just take the whole thing if it matches city? kinda weird but fallback
                }
            }
        });
        return Array.from(neighborhoods).sort();
    }

    async findByLocation(userId: string, city: string, neighborhood: string, type?: string) {
        // Try precise match first
        const where: any = {
            userId,
            city,
            neighborhood
        };
        if (type) where.type = type;

        const exactMatches = await this.propertiesRepository.find({ where });

        if (exactMatches.length > 0) return exactMatches;

        // Fallback legacy
        const query = this.propertiesRepository
            .createQueryBuilder('property')
            .where('property.userId = :userId', { userId })
            .andWhere('(property.city IS NULL OR property.city = "")')
            .andWhere('property.location LIKE :city', { city: `%${city}%` })
            .andWhere('property.location LIKE :neighborhood', { neighborhood: `%${neighborhood}%` });

        if (type) {
            query.andWhere('property.type = :type', { type });
        }

        return query.getMany();
    }
}
