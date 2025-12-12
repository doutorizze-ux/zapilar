import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ChatGateway } from './chat.gateway';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class WhatsappService implements OnModuleInit {
    private readonly logger = new Logger(WhatsappService.name);
    // Communication with Evolution API via docker internal network
    private readonly EVOLUTION_URL = 'http://evolution:8080';
    private readonly API_KEY = 'B8D69066-512E-4161-8C2A-4C2366881234';

    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService,
        private chatGateway: ChatGateway,
        private readonly httpService: HttpService
    ) { }

    onModuleInit() {
        this.initializeAI();
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.API_KEY
        };
    }

    // --- Session Management ---

    async getSession(userId: string) {
        try {
            // Check connection state
            const stateUrl = `${this.EVOLUTION_URL}/instance/connectionState/${userId}`;
            let state = 'close';

            try {
                const stateRes = await firstValueFrom(this.httpService.get(stateUrl, { headers: this.getHeaders() }));
                state = stateRes.data?.instance?.state || 'close';
            } catch (e) {
                // Instance might not exist
            }

            if (state === 'open') {
                return { status: 'CONNECTED', qr: null };
            }

            // Create instance if needed
            try {
                await firstValueFrom(this.httpService.post(`${this.EVOLUTION_URL}/instance/create`, {
                    instanceName: userId,
                    token: userId,
                    qrcode: true
                }, { headers: this.getHeaders() }));
            } catch (e) {
                // Ignore if already exists
            }

            // Connect to get QR
            const connectUrl = `${this.EVOLUTION_URL}/instance/connect/${userId}`;
            const connectRes = await firstValueFrom(this.httpService.get(connectUrl, { headers: this.getHeaders() }));

            if (connectRes.data?.base64) {
                return { status: 'QR_READY', qr: connectRes.data.base64 };
            }

            return { status: 'DISCONNECTED', qr: null };

        } catch (error) {
            this.logger.error(`Error getting session for ${userId}`, error.message);
            return { status: 'DISCONNECTED', qr: null };
        }
    }

    async resetSession(userId: string) {
        try {
            this.logger.log(`Resetting session for ${userId}`);
            await firstValueFrom(this.httpService.delete(`${this.EVOLUTION_URL}/instance/delete/${userId}`, { headers: this.getHeaders() }));
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to reset session ${userId}`, error.message);
            return { success: true };
        }
    }

    setBotPaused(userId: string, paused: boolean) {
        // TODO: Implement DB persistence
    }

    isBotPaused(userId: string): boolean {
        return false;
    }

    // --- Messaging ---

    async sendManualMessage(userId: string, to: string, message: string) {
        try {
            const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
            const number = jid.replace(/\D/g, ''); // Evolution usually takes just numbers for sendText

            await firstValueFrom(this.httpService.post(`${this.EVOLUTION_URL}/message/sendText/${userId}`, {
                number: number,
                text: message
            }, { headers: this.getHeaders() }));

            // Log manually
            this.logMessage(userId, jid, 'me', message, 'Atendente', true);

        } catch (error) {
            this.logger.error(`Failed to send message for ${userId}`, error.message);
            throw new Error('Failed to send message via Evolution API');
        }
    }

    // --- History & Analytics ---

    async getChatHistory(storeId: string, contactId: string) {
        return this.chatRepository.find({
            where: { storeId, contactId },
            order: { createdAt: 'ASC' }
        });
    }

    async getRecentChats(storeId: string) {
        const rawChats = await this.chatRepository
            .createQueryBuilder("msg")
            .select("msg.contactId", "id")
            .addSelect("MAX(CASE WHEN msg.isBot = 0 AND msg.from != 'me' THEN msg.senderName ELSE NULL END)", "customerName")
            .addSelect("MAX(msg.createdAt)", "lastTime")
            .addSelect("MAX(CONCAT(msg.createdAt, '|||', msg.body))", "rawLastMessage")
            .where("msg.storeId = :storeId", { storeId })
            .groupBy("msg.contactId")
            .orderBy("lastTime", "DESC")
            .getRawMany();

        return rawChats.map(chat => {
            let body = '';
            if (chat.rawLastMessage) {
                const parts = chat.rawLastMessage.split('|||');
                if (parts.length >= 2) body = parts.slice(1).join('|||');
                else body = chat.rawLastMessage;
            }
            return {
                id: chat.id,
                name: chat.customerName || chat.id,
                lastTime: chat.lastTime,
                lastMessage: body
            };
        });
    }

    private async logMessage(storeId: string, contactId: string, from: string, body: string, senderName: string, isBot: boolean) {
        try {
            await this.chatRepository.save({
                storeId,
                contactId,
                from,
                body,
                senderName,
                isBot
            });
        } catch (e) {
            this.logger.error('Failed to log message', e);
        }
    }
}
