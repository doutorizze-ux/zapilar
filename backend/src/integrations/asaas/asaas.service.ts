import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      'ASAAS_API_URL',
      'https://api-sandbox.asaas.com/v3',
    );
    let rawKey = this.configService.get<string>('ASAAS_API_KEY', '');

    // Fix: Remove double $ if present (common env escaping artifact)
    if (rawKey.startsWith('$$')) {
      rawKey = rawKey.substring(1);
    }

    // Check if key is Base64 encoded (contains no special chars like $)
    // Asaas keys start with $ usually. If it doesn't, assume Base64 and try to decode.
    if (
      rawKey &&
      !rawKey.startsWith('$') &&
      !rawKey.startsWith("'$") &&
      !rawKey.startsWith('"$')
    ) {
      try {
        const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
        if (decoded.startsWith('$')) {
          rawKey = decoded;
          this.logger.log(
            'Detected Base64 Encoded ASAAS_API_KEY. Decoded successfully.',
          );
        }
      } catch (e) {
        // Not base64 or failed, use as is
      }
    }

    this.apiKey = rawKey;

    if (this.apiKey) {
      this.logger.log(
        `ASAAS_API_KEY loaded: ${this.apiKey.substring(0, 5)}...`,
      );
    }

    if (!this.apiKey) {
      this.logger.warn(
        'ASAAS_API_KEY is not set. Asaas integration will not work.',
      );
    }
  }

  private async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
  ) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      access_token: this.apiKey,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Asaas API Error [${method} ${url}]: ${JSON.stringify(data)}`,
        );
        const errorMessage =
          data.errors?.[0]?.description || 'Error communicating with Asaas';
        throw new Error(`${errorMessage} (${data.errors?.[0]?.code})`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Asaas Request Failed: ${error.message}`);
      throw error;
    }
  }

  async createCustomer(data: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
    externalReference?: string;
  }) {
    return this.request('/customers', 'POST', data);
  }

  async createSubscription(data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD';
    value: number;
    nextDueDate: string;
    cycle: string;
    description?: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      phone: string;
    };
    remoteIp?: string;
  }) {
    const payload: any = {
      ...data,
    };

    if (data.billingType === 'CREDIT_CARD') {
      if (!data.creditCard || !data.creditCardHolderInfo) {
        throw new Error(
          'Credit card details and holder info are required for CREDIT_CARD billing type',
        );
      }
    }

    return this.request('/subscriptions', 'POST', payload);
  }

  async getSubscription(id: string) {
    return this.request(`/subscriptions/${id}`, 'GET');
  }

  async getPayment(id: string) {
    return this.request(`/payments/${id}`, 'GET');
  }

  async createPayment(data: {
    customer: string;
    billingType: string;
    value: number;
    dueDate: string;
    description?: string;
  }) {
    return this.request('/payments', 'POST', data);
  }

  async getSubscriptionPayments(subscriptionId: string) {
    return this.request(`/subscriptions/${subscriptionId}/payments`, 'GET');
  }

  async getPixQrCode(paymentId: string) {
    return this.request(`/payments/${paymentId}/pixQrCode`, 'GET');
  }
}
