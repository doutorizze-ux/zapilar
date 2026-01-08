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
import { FaqService } from './faq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('faqs')
@UseGuards(JwtAuthGuard)
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.faqService.create(req.user.userId, body);
  }

  @Get()
  findAll(@Request() req) {
    return this.faqService.findAll(req.user.userId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.faqService.update(id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.faqService.remove(id, req.user.userId);
  }
}
