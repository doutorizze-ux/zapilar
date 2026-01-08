import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';
import { AsaasService } from '../integrations/asaas/asaas.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private usersService: UsersService,
    private plansService: PlansService,
    private asaasService: AsaasService,
    private configService: ConfigService,
  ) {}

  async createSubscription(userId: string, data: any) {
    const { planId, billingType, creditCard, creditCardHolderInfo } = data;

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.plansService.findOne(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    let customerId = user.asaasCustomerId;

    // Extract customer data from payload if provided
    const holderInfo = creditCardHolderInfo || {};
    const customerData = {
      name: holderInfo.name || user.storeName || user.email,
      email: holderInfo.email || user.email,
      cpfCnpj: holderInfo.cpfCnpj || user.document,
      phone: holderInfo.phone || user.phone,
      postalCode: holderInfo.postalCode,
      addressNumber: holderInfo.addressNumber,
    };

    if (!customerData.cpfCnpj) {
      throw new BadRequestException('CPF ou CNPJ é obrigatório para assinar.');
    }

    // Update user if missing info
    if (!user.document && customerData.cpfCnpj) {
      await this.usersService.updateById(user.id, {
        document: customerData.cpfCnpj,
      });
    }
    if (!user.phone && customerData.phone) {
      await this.usersService.updateById(user.id, {
        phone: customerData.phone,
      });
    }

    if (!customerId) {
      try {
        const customer = await this.asaasService.createCustomer({
          name: customerData.name,
          email: customerData.email,
          cpfCnpj: customerData.cpfCnpj,
          externalReference: user.id,
          phone: customerData.phone,
        });
        customerId = customer.id;
        await this.usersService.updateById(user.id, {
          asaasCustomerId: customerId,
        });
      } catch (error) {
        console.error('Error creating Asaas customer. Payload:', customerData);
        console.error('Asaas API Error Detail:', error.message);

        // Propagate the actual error message from Asaas (e.g., "CPF inválido")
        throw new BadRequestException(
          `Erro no provedor de pagamento: ${error.message}`,
        );
      }
    }

    // Determine frontend URL and optional callback
    const asaasSuccessUrl = this.configService.get<string>('ASAAS_SUCCESS_URL');

    const subscriptionPayload: any = {
      billingType: billingType || 'PIX',
      value: plan.price,
      nextDueDate: new Date().toISOString().split('T')[0],
      cycle: plan.interval,
      description: `Assinatura Plano ${plan.name}`,
      creditCard,
      creditCardHolderInfo,
    };

    if (asaasSuccessUrl) {
      subscriptionPayload.callback = {
        successUrl: asaasSuccessUrl,
      };
    }

    let subscription;
    try {
      subscription = await this.asaasService.createSubscription({
        customer: customerId,
        ...subscriptionPayload,
      });
    } catch (error) {
      // Check if error is due to invalid customer ID (common when switching Sandbox -> Prod)
      if (
        error.message &&
        (error.message.includes('invalid_customer') ||
          error.message.includes('Cliente inválido'))
      ) {
        console.warn(
          `[Subscriptions] Invalid Customer ID ${customerId} detected. Creating new customer...`,
        );

        try {
          const newCustomer = await this.asaasService.createCustomer({
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj,
            externalReference: user.id,
            phone: customerData.phone,
          });

          customerId = newCustomer.id;
          await this.usersService.updateById(user.id, {
            asaasCustomerId: customerId,
          });

          // Retry subscription creation with new ID
          subscription = await this.asaasService.createSubscription({
            customer: customerId,
            ...subscriptionPayload,
          });
        } catch (retryError) {
          console.error(
            'Failed to recover from invalid_customer error:',
            retryError,
          );
          throw new BadRequestException(
            retryError.message || 'Falha ao recriar cliente e assinatura.',
          );
        }
      } else {
        console.error('Error creating Asaas subscription:', error);
        throw new BadRequestException(
          error.message || 'Failed to create subscription',
        );
      }
    }

    try {
      await this.usersService.updateById(user.id, {
        subscriptionId: subscription.id,
        planId: planId,
      });

      let pixQrCode = null;
      let paymentUrl = null;
      if (billingType === 'PIX') {
        try {
          const payments = await this.asaasService.getSubscriptionPayments(
            subscription.id,
          );
          if (payments.data && payments.data.length > 0) {
            const pendingPayment = payments.data[0];
            paymentUrl = pendingPayment.invoiceUrl;
            try {
              pixQrCode = await this.asaasService.getPixQrCode(
                pendingPayment.id,
              );
            } catch (pixError) {
              console.error(
                'Error fetching Pix QR Code, but payment URL is available:',
                pixError,
              );
            }
          }
        } catch (e) {
          console.error('Error fetching Pix QR Code:', e);
        }
      }

      return { subscription, pixQrCode, paymentUrl };
    } catch (postSubError) {
      console.error('Error post-subscription processing:', postSubError);
      // Return subscription anyway since it was created at the provider
      return { subscription };
    }
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.subscriptionId) return { active: false };

    // Handle manual override (Free Plan given by Admin)
    if (user.subscriptionId === 'MANUAL') {
      const planDetails = user.planId
        ? await this.plansService.findOne(user.planId)
        : null;
      return {
        active: true,
        status: 'ACTIVE',
        planId: user.planId,
        planName: planDetails?.name || 'Plano Manual',
        maxProperties: planDetails?.propertyLimit || 50,
        cycle: 'MANUAL',
        nextDueDate: null, // Perpetual
        value: planDetails?.price || 0,
        billingType: 'FREE',
        latestPaymentStatus: 'COMPLETED',
      };
    }

    try {
      const sub = await this.asaasService.getSubscription(user.subscriptionId);
      try {
        const payments = await this.asaasService.getSubscriptionPayments(
          user.subscriptionId,
        );
        const latestPayment =
          payments.data && payments.data.length > 0 ? payments.data[0] : null;

        // If the latest payment is confirmed/received, we can consider the user "active" even if subscription status lags
        const planDetails = user.planId
          ? await this.plansService.findOne(user.planId)
          : null;

        return {
          ...sub,
          planId: user.planId,
          planName: planDetails?.name || 'Plano Desconhecido',
          maxProperties: planDetails?.propertyLimit || 50, // Default fallback
          latestPaymentStatus: latestPayment ? latestPayment.status : 'UNKNOWN',
          latestPaymentId: latestPayment ? latestPayment.id : null,
        };
      } catch (pError) {
        console.error('Error fetching payments details:', pError);
        return sub;
      }
    } catch (e) {
      return { active: false, error: 'Could not fetch subscription' };
    }
  }
  async handleWebhook(body: any) {
    const { event, payment, subscription } = body;
    console.log(`[Subscriptions] Processing webhook event: ${event}`);
    // We can implement logic here later to auto-activate users or update payment status in database if we were caching it.
    // Currently we fetch real-time from Asaas on dashboard load, so passive listening is enough for now or extending logs.
    return true;
  }
}
