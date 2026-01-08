import {
  Controller,
  Get,
  Post,
  Body,
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
  constructor(private readonly leadsService: LeadsService) {}

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
}
