import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('whatsapp')
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) { }

    @UseGuards(JwtAuthGuard)
    @Get('status')
    async getStatus(@Request() req) {
        return this.whatsappService.getSession(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('pause')
    async togglePause(@Request() req, @Body() body: { paused: boolean }) {
        this.whatsappService.setBotPaused(req.user.userId, body.paused);
        return { success: true, paused: body.paused };
    }

    @UseGuards(JwtAuthGuard)
    @Get('pause-status')
    async getPauseStatus(@Request() req) {
        const isPaused = this.whatsappService.isBotPaused(req.user.userId);
        return { paused: isPaused };
    }
}
