import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('webhook')
export class SubscriptionsWebhookController {
  private readonly logger = new Logger(SubscriptionsWebhookController.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('asaas')
  @HttpCode(200)
  async handleAsaasWebhook(@Body() body: any) {
    this.logger.log(`Webhook Asaas recebido: ${body.event}`);

    try {
      await this.subscriptionsService.handleWebhook(body);
    } catch (error) {
      this.logger.error('Erro ao processar webhook', error);
    }

    return { received: true };
  }
}
