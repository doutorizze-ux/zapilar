import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
    constructor(private readonly service: FinancialService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateTransactionDto) {
        // Ensure amount is number
        dto.amount = Number(dto.amount);
        return this.service.create(req.user.userId, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user.userId);
    }

    @Get('summary')
    getSummary(@Request() req) {
        return this.service.getSummary(req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: CreateTransactionDto) {
        // Ensure amount is number
        if (dto.amount) dto.amount = Number(dto.amount);
        return this.service.update(id, req.user.userId, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.service.remove(id, req.user.userId);
    }
}
