import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Request() req) {
        return this.leadsService.findAll(req.user.userId);
    }
}
