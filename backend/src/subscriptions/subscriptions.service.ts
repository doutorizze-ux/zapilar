
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';
import { AsaasService } from '../integrations/asaas/asaas.service';

@Injectable()
export class SubscriptionsService {
    constructor(
        private usersService: UsersService,
        private plansService: PlansService,
        private asaasService: AsaasService,
    ) { }

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
            addressNumber: holderInfo.addressNumber
        };

        if (!customerData.cpfCnpj) {
            throw new BadRequestException('CPF ou CNPJ é obrigatório para assinar.');
        }

        // Update user if missing info
        if (!user.document && customerData.cpfCnpj) {
            await this.usersService.updateById(user.id, { document: customerData.cpfCnpj });
        }
        if (!user.phone && customerData.phone) {
            await this.usersService.updateById(user.id, { phone: customerData.phone });
        }

        if (!customerId) {
            try {
                const customer = await this.asaasService.createCustomer({
                    name: customerData.name,
                    email: customerData.email,
                    cpfCnpj: customerData.cpfCnpj,
                    externalReference: user.id,
                    phone: customerData.phone
                });
                customerId = customer.id;
                await this.usersService.updateById(user.id, { asaasCustomerId: customerId });
            } catch (error) {
                console.error('Error creating Asaas customer. Payload:', customerData);
                console.error('Asaas API Error Detail:', error.message);

                // Propagate the actual error message from Asaas (e.g., "CPF inválido")
                throw new BadRequestException(`Erro no provedor de pagamento: ${error.message}`);
            }
        }

        try {
            const subscription = await this.asaasService.createSubscription({
                customer: customerId,
                billingType: billingType || 'PIX',
                value: plan.price,
                nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                cycle: plan.interval,
                description: `Assinatura Plano ${plan.name}`,
                creditCard,
                creditCardHolderInfo
            });

            await this.usersService.updateById(user.id, { subscriptionId: subscription.id, planId: planId });

            let pixQrCode = null;
            let paymentUrl = null;
            if (billingType === 'PIX') {
                try {
                    const payments = await this.asaasService.getSubscriptionPayments(subscription.id);
                    if (payments.data && payments.data.length > 0) {
                        const pendingPayment = payments.data[0];
                        paymentUrl = pendingPayment.invoiceUrl;
                        try {
                            pixQrCode = await this.asaasService.getPixQrCode(pendingPayment.id);
                        } catch (pixError) {
                            console.error('Error fetching Pix QR Code, but payment URL is available:', pixError);
                        }
                    }
                } catch (e) {
                    console.error('Error fetching Pix QR Code:', e);
                }
            }

            return { subscription, pixQrCode, paymentUrl };
        } catch (error) {
            console.error('Error creating Asaas subscription:', error);
            throw new BadRequestException(error.message || 'Failed to create subscription');
        }
    }

    async getSubscriptionStatus(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user?.subscriptionId) return { active: false };

        try {
            const sub = await this.asaasService.getSubscription(user.subscriptionId);
            try {
                const payments = await this.asaasService.getSubscriptionPayments(user.subscriptionId);
                const latestPayment = payments.data && payments.data.length > 0 ? payments.data[0] : null;

                // If the latest payment is confirmed/received, we can consider the user "active" even if subscription status lags
                return {
                    ...sub,
                    planId: user.planId,
                    planName: user.planId ? (await this.plansService.findOne(user.planId))?.name : 'Plano Desconhecido',
                    latestPaymentStatus: latestPayment ? latestPayment.status : 'UNKNOWN',
                    latestPaymentId: latestPayment ? latestPayment.id : null
                };
            } catch (pError) {
                console.error('Error fetching payments details:', pError);
                return sub;
            }
        } catch (e) {
            return { active: false, error: 'Could not fetch subscription' };
        }
    }
}
