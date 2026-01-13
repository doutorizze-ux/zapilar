import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  Delete,
  Param,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(req.user.userId, createLeadDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.leadsService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.leadsService.remove(id, req.user.userId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('matches/:propertyId')
  async getMatches(@Request() req, @Param('propertyId') propertyId: string) {
    return this.leadsService.getMatchesForProperty(req.user.userId, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('column') column: string,
  ) {
    return this.leadsService.updateStatus(id, req.user.userId, column);
  }
}
