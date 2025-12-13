import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
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
    @Get('history')
    async getHistory(@Request() req, @Query('contactId') contactId: string) {
        if (!contactId) return [];
        return this.whatsappService.getChatHistory(req.user.userId, contactId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('chats')
    async getChats(@Request() req) {
        return this.whatsappService.getRecentChats(req.user.userId);
    }



    @UseGuards(JwtAuthGuard)
    @Post('send')
    async sendMessage(@Request() req, @Body() body: { to: string; message: string }) {
        await this.whatsappService.sendManualMessage(req.user.userId, body.to, body.message);
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('pause-status')
    async getPauseStatus(@Request() req) {
        const isPaused = this.whatsappService.isBotPaused(req.user.userId);
        return { paused: isPaused };
    }

    @UseGuards(JwtAuthGuard)
    @Post('reset')
    async resetConnection(@Request() req) {
        await this.whatsappService.deleteInstance(req.user.userId);
        return { success: true, message: 'Instance deleted. Reconnect now.' };
    }

    @Post('webhook')
    async handleWebhook(@Body() payload: any) {
        console.log('[Controller] Webhook hit!', JSON.stringify(payload).substring(0, 100));
        await this.whatsappService.handleWebhook(payload);
        return { status: 'ok' };
    }

    @Get('debug-info')
    async getDebugInfo() {
        const dns = require('dns').promises;
        let backendIp = 'unknown';
        let evoIp = 'unknown';

        try {
            const res = await dns.lookup('backend');
            backendIp = res.address;
        } catch (e) { backendIp = e.message; }

        try {
            const res = await dns.lookup('evolution-api');
            evoIp = res.address;
        } catch (e) { evoIp = e.message; }

        return {
            env_webhook: process.env.WEBHOOK_URL,
            env_evolution: process.env.EVOLUTION_API_URL,
            resolved_backend: backendIp,
            resolved_evolution: evoIp,
            smart_fix_active: process.env.EVOLUTION_API_URL?.includes('evolution-api'),
            smart_target: 'http://backend:3000/whatsapp/webhook'
        };
    }
}
