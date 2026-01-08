import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsService } from '../leads/leads.service';
import { PropertiesService } from '../properties/properties.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private leadsService: LeadsService,
    private propertiesService: PropertiesService,
    private usersService: UsersService,
    private plansService: PlansService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const leadsStats = await this.leadsService.getStats(req.user.userId);
    const properties = await this.propertiesService.findAll(req.user.userId);

    return {
      activeProperties: properties.length,
      leads: leadsStats.totalLeads,
      recentLeads: leadsStats.recentLeads,
      // Mock interaction count (e.g. leads * 5) or use another table later
      interactions: leadsStats.totalLeads * 5,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin-stats')
  async getAdminStats() {
    // 1. Total Users
    const users = await this.usersService.findAll();
    const totalUsers = users.length;

    // 2. Active Plans (Users with planId)
    const activeUsers = users.filter((u) => u.planId);
    const activePlansCount = activeUsers.length;

    // 3. Monthly Revenue (Mock calculation based on planId occurrences)
    // Ideally we join Plans table, but for now lets fetch plans
    const plans = await this.plansService.findAll();
    let monthlyRevenue = 0;

    activeUsers.forEach((user) => {
      const plan = plans.find((p) => p.id === user.planId);
      if (plan) {
        monthlyRevenue += Number(plan.price);
      }
    });

    // 4. Total Properties
    const allProperties = await this.propertiesService.findAll();
    const totalProperties = allProperties.length;

    // 5. Recent Users (Last 5)
    // Assuming users are returned by ID or created order, simpler to just sort in JS if small app
    // or add findRecent to service. For MVP, sort here.
    const recentUsers = users
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5);

    return {
      totalUsers,
      activePlansCount,
      monthlyRevenue,
      totalProperties,
      recentUsers,
    };
  }
}
