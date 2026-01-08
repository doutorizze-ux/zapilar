import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateEventDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: CreateEventDto) {
    return this.service.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.userId);
  }
}
