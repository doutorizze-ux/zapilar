import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsService } from '../leads/leads.service';
import { VehiclesService } from '../vehicles/vehicles.service';

@Controller('dashboard')
export class DashboardController {
    constructor(
        private leadsService: LeadsService,
        private vehiclesService: VehiclesService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    async getStats(@Request() req) {
        const leadsStats = await this.leadsService.getStats(req.user.userId);
        const vehicles = await this.vehiclesService.findAll(req.user.userId);

        return {
            activeVehicles: vehicles.length,
            leads: leadsStats.totalLeads,
            recentLeads: leadsStats.recentLeads,
            // Mock interaction count (e.g. leads * 5) or use another table later
            interactions: leadsStats.totalLeads * 5
        };
    }
}
