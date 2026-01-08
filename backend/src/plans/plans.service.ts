import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanInterval } from './entities/plan.entity';

@Injectable()
export class PlansService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private plansRepository: Repository<Plan>,
  ) {}

  async onModuleInit() {
    await this.seedPlans();
  }

  async seedPlans() {
    const count = await this.plansRepository.count();
    if (count === 0) {
      const plans = [
        {
          name: 'Básico',
          description: 'Plano ideal para quem está começando',
          price: 97.0,
          interval: PlanInterval.MONTHLY,
          features: ['1 Atendente', 'Disparos manuais', 'Suporte por e-mail'],
          isActive: true,
        },
        {
          name: 'Profissional',
          description: 'Para empresas em crescimento',
          price: 197.0,
          interval: PlanInterval.MONTHLY,
          features: [
            '5 Atendentes',
            'Disparos automáticos',
            'Suporte prioritário',
            'Chatbot',
          ],
          isActive: true,
        },
        {
          name: 'Enterprise',
          description: 'Solução completa',
          price: 497.0,
          interval: PlanInterval.MONTHLY,
          features: ['Ilimitado', 'API Dedicada', 'Gerente de conta'],
          isActive: true,
        },
      ];

      for (const p of plans) {
        await this.plansRepository.save(this.plansRepository.create(p));
      }
      console.log('Default plans seeded');
    }
  }

  findAll() {
    return this.plansRepository.find({ where: { isActive: true } });
  }

  findOne(id: string) {
    return this.plansRepository.findOne({ where: { id } });
  }

  create(planData: Partial<Plan>) {
    const plan = this.plansRepository.create(planData);
    return this.plansRepository.save(plan);
  }

  async update(id: string, planData: Partial<Plan>) {
    await this.plansRepository.update(id, planData);
    return this.plansRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    // Soft delete by setting isActive to false
    await this.plansRepository.update(id, { isActive: false });
    return { deleted: true };
  }
}
