import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutomationService } from './automation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';

@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    @InjectRepository(Property)
    private readonly propertiesRepo: Repository<Property>,
  ) {}

  /** GET /automation/settings — retorna configurações do usuário */
  @Get('settings')
  getSettings(@Request() req) {
    return this.automationService.getSettings(req.user.userId);
  }

  /** PATCH /automation/settings — salva configurações */
  @Patch('settings')
  updateSettings(@Request() req, @Body() body: any) {
    return this.automationService.updateSettings(req.user.userId, body);
  }

  /** GET /automation/stats — painel de automações */
  @Get('stats')
  getStats(@Request() req) {
    return this.automationService.getAutomationStats(req.user.userId);
  }

  /** GET /automation/cold-leads — leads frios para follow-up */
  @Get('cold-leads')
  getColdLeads(@Request() req) {
    return this.automationService.getColdLeads(req.user.userId);
  }

  /** POST /automation/weekly-report — gera relatório semanal (texto) */
  @Post('weekly-report')
  async getWeeklyReport(@Request() req) {
    const report = await this.automationService.generateWeeklyReport(req.user.userId);
    return { report };
  }

  /** POST /automation/match-property — encontra leads que combinam com um imóvel */
  @Post('match-property')
  async matchProperty(@Request() req, @Body() body: { propertyId: string }) {
    const property = await this.propertiesRepo.findOne({ where: { id: body.propertyId } });
    if (!property) return { matches: [], message: 'Imóvel não encontrado' };

    const matches = await this.automationService.findMatchingLeadsForProperty(req.user.userId, property);
    return {
      total: matches.length,
      matches: matches.map(l => ({ id: l.id, name: l.name, phone: l.phone, interestSubject: l.interestSubject })),
    };
  }
}
