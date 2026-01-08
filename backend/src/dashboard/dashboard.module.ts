import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [LeadsModule, PropertiesModule, UsersModule, PlansModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
