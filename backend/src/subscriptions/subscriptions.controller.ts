
import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createSubscription(@Request() req, @Body() body: any) {
        // body: { planId, billingType, creditCard, creditCardHolderInfo, ... }
        return this.subscriptionsService.createSubscription(req.user.userId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('my-subscription')
    async getMySubscription(@Request() req) {
        return this.subscriptionsService.getSubscriptionStatus(req.user.userId);
    }

    @Post('webhook/asaas')
    async handleWebhook(@Body() body: any) {
        return this.subscriptionsService.handleWebhook(body);
    }
}
