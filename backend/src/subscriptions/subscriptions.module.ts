import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsWebhookController } from './subscriptions.webhook.controller';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { AsaasModule } from '../integrations/asaas/asaas.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UsersModule, PlansModule, AsaasModule, WhatsappModule],
  controllers: [SubscriptionsController, SubscriptionsWebhookController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule { }
