import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { LeadsModule } from '../leads/leads.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
    imports: [LeadsModule, VehiclesModule],
    controllers: [DashboardController]
})
export class DashboardModule { }
