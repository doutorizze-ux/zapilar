import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { ChatMessage } from './entities/chat-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class WhatsappService implements OnModuleInit {
    private readonly logger = new Logger(WhatsappService.name);

    // Map<userId, qrCodeString>
    private qrCodes: Map<string, string> = new Map();
    // Map<userId, status>
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private pausedUsers: Set<string> = new Set();
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    private evolutionUrl: string;
    private evolutionApiKey: string;

    setBotPaused(userId: string, paused: boolean) {
        if (paused) {
            this.pausedUsers.add(userId);
        } else {
            this.pausedUsers.delete(userId);
        }
        this.logger.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    isBotPaused(userId: string): boolean {
        return this.pausedUsers.has(userId);
    }

    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService,
        private chatGateway: ChatGateway
    ) { }

    onModuleInit() {
        this.evolutionUrl = this.configService.get<string>('EVOLUTION_API_URL') || 'http://localhost:8081';
        this.evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
        this.initializeAI();
        // Optional: specific init logic like checking instances could go here
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        } else {
            this.logger.warn('GEMINI_API_KEY not found. AI features disabled.');
        }
    }

    // Helper to log message
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

    // Helper to fetch history
    async getChatHistory(storeId: string, contactId: string) {
        return this.chatRepository.find({
            where: { storeId, contactId },
            order: { createdAt: 'ASC' }
        });
    }

    async getRecentChats(storeId: string) {
        // Fetch distinct contacts from message history
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
                if (parts.length >= 2) {
                    body = parts.slice(1).join('|||');
                } else {
                    body = chat.rawLastMessage;
                }
            }

            return {
                id: chat.id,
                name: chat.customerName || chat.id,
                lastTime: chat.lastTime,
                lastMessage: body
            };
        });
    }

    // --- Evolution API Interactions ---

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.evolutionApiKey
        };
    }

    private getInstanceName(userId: string) {
        return `store-${userId}`;
    }

    async getSession(userId: string) {
        const instanceName = this.getInstanceName(userId);

        try {
            // Check connection state
            const stateRes = await axios.get(`${this.evolutionUrl}/instance/connectionState/${instanceName}`, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (stateRes.status === 404) {
                // Instance doesn't exist, create it
                await this.createInstance(userId);
                return { status: 'DISCONNECTED', qr: null };
            }

            const state = stateRes.data?.instance?.state || 'close';

            if (state === 'open') {
                this.statuses.set(userId, 'CONNECTED');
                // Ensure webhook is set for v1.8.2 stability
                await this.ensureWebhook(userId);
                return { status: 'CONNECTED', qr: null };
            } else if (state === 'connecting') {
                // Try to fetch QR
                const qrRes = await axios.get(`${this.evolutionUrl}/instance/connect/${instanceName}`, {
                    headers: this.getHeaders()
                });
                if (qrRes.data?.code) {
                    this.statuses.set(userId, 'QR_READY');
                    this.qrCodes.set(userId, qrRes.data.code);
                    return { status: 'QR_READY', qr: qrRes.data.code };
                }
            }

            return { status: 'DISCONNECTED', qr: this.qrCodes.get(userId) || null };

        } catch (error) {
            this.logger.error(`Error checking session for ${userId}`, error);
            // If failed, try to create instance if not exists
            if (error.response?.status === 404) {
                await this.createInstance(userId);
            }
            return { status: 'DISCONNECTED', qr: null };
        }
    }

    private async createInstance(userId: string) {
        const instanceName = this.getInstanceName(userId);
        try {
            this.logger.log(`Creating instance for ${userId}`);

            // v1.8.2 Payload Structure (Stable)
            const payload = {
                instanceName: instanceName,
                token: instanceName,
                qrcode: true,
                webhook: this.configService.get('WEBHOOK_URL') || undefined
            };

            await axios.post(`${this.evolutionUrl}/instance/create`, payload, { headers: this.getHeaders() });

        } catch (e) {
            this.logger.error(`Failed to create instance for ${userId}`, e.response?.data || e.message);
        }
    }

    async deleteInstance(userId: string) {
        const instanceName = this.getInstanceName(userId);
        try {
            this.logger.log(`Deleting instance for ${userId}`);
            await axios.delete(`${this.evolutionUrl}/instance/delete/${instanceName}`, { headers: this.getHeaders() });
            this.statuses.delete(userId);
            this.qrCodes.delete(userId);
        } catch (e) {
            this.logger.error(`Failed to delete instance for ${userId}`, e.response?.data || e.message);
        }
    }

    private async ensureWebhook(userId: string) {
        const instanceName = this.getInstanceName(userId);
        const webhookUrl = this.configService.get('WEBHOOK_URL');
        if (!webhookUrl) return;

        try {
            // Check if webhook is already set (optional optimization, but v1 is fast)
            // Just force set it
            // v1 endpoint: /webhook/set/:instance
            await axios.post(`${this.evolutionUrl}/webhook/set/${instanceName}`, {
                webhookUrl: webhookUrl,
                webhookByEvents: true, // Enforce specific events
                events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'messages.upsert'],
                enabled: true
            }, { headers: this.getHeaders() });

            // this.logger.log(`Webhook enforced for ${userId}`);
        } catch (e) {
            // Ignore error or log debug, it might fail if instance not ready yet
            this.logger.debug(`Failed to ensure webhook for ${userId}: ${e.message}`);
        }
    }

    // Send text message via Evolution
    async sendMessage(userId: string, to: string, text: string) {
        const instanceName = this.getInstanceName(userId);
        let number = to.replace(/\D/g, '');

        try {
            await axios.post(`${this.evolutionUrl}/message/sendText/${instanceName}`, {
                number: number,
                options: {
                    delay: 1200,
                    presence: 'composing'
                },
                textMessage: {
                    text: text
                }
            }, { headers: this.getHeaders() });
        } catch (e) {
            this.logger.error(`Failed to send message to ${to}`, e.response?.data || e.message);
        }
    }

    // Send media/image
    async sendImage(userId: string, to: string, imageUrl: string, caption?: string) {
        const instanceName = this.getInstanceName(userId);
        let number = to.replace(/\D/g, '');

        try {
            await axios.post(`${this.evolutionUrl}/message/sendMedia/${instanceName}`, {
                number: number,
                options: {
                    delay: 1200,
                    presence: 'composing'
                },
                mediaMessage: {
                    mediatype: 'image',
                    caption: caption,
                    media: imageUrl
                }
            }, { headers: this.getHeaders() });
        } catch (e) {
            this.logger.error(`Failed to send image to ${to}`, e.response?.data || e.message);
        }
    }

    // --- Handler for Manual Messages (from Controller) ---
    async sendManualMessage(userId: string, to: string, message: string) {
        await this.sendMessage(userId, to, message);

        // Log manual message
        this.logMessage(userId, to, 'me', message, 'Atendente', true);

        // Emit to frontend (so it appears as sent by 'me')
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'manual-' + Date.now(),
            from: 'me',
            body: message,
            timestamp: Date.now() / 1000,
            senderName: 'Atendente',
            isBot: true
        });
    }


    // --- Webhook Payload Handler ---

    async handleWebhook(payload: any) {
        this.logger.log(`[Webhook Receipt] Payload: ${JSON.stringify(payload)}`);

        // Evolution API payload
        // v1.8.2 structure often has instance in root or data
        const instanceName = payload.instance || payload.sender?.instanceId;

        if (!instanceName || !instanceName.startsWith('store-')) {
            return;
        }

        const userId = instanceName.replace('store-', '');
        const data = payload.data;
        const msgType = payload.type || payload.event; // v1 uses 'event', v2 uses 'type'

        // Check for message event (v1: messages.upsert, v2: MESSAGES_UPSERT)
        if (msgType !== 'MESSAGES_UPSERT' && msgType !== 'messages.upsert') {
            this.logger.debug(`Ignored webhook event type: ${msgType}`);
            return;
        }

        if (!data || !data.key) {
            this.logger.debug('Webhook data or key missing');
            return;
        }

        // If fromMe is true, it means WE sent it via phone. 
        // We usually want to see these in the dashboard too to keep history synced!
        // So I am REMOVING the return on fromMe, but I will flag it.
        const fromMe = data.key.fromMe;

        const remoteJid = data.key.remoteJid;
        const cleanFrom = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '');

        // Extract body
        let body = '';
        if (data.message?.conversation) {
            body = data.message.conversation;
        } else if (data.message?.extendedTextMessage?.text) {
            body = data.message.extendedTextMessage.text;
        } else if (data.message?.imageMessage?.caption) {
            body = data.message.imageMessage.caption;
        } else if (typeof data.message === 'string') {
            // Sometimes v1 sends simpler structure
            body = data.message;
        }

        if (!body) return;

        const pushName = data.pushName || cleanFrom;

        await this.processIncomingMessage(userId, cleanFrom, pushName, body);
    }



    // --- Logic from handleMessage ---
    private async processIncomingMessage(userId: string, from: string, senderName: string, text: string) {
        this.logger.log(`[DEBUG] Processing incoming msg. User: ${userId}, From: ${from}, Text: ${text}`);

        // Log incoming
        await this.logMessage(userId, from, from, text, senderName, false);

        // Emit to Live Chat
        this.logger.log(`[DEBUG] Emitting to Live Chat Room: ${userId}`);
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'msg-' + Date.now(),
            from: from,
            body: text,
            timestamp: Date.now() / 1000,
            senderName: senderName,
            isBot: false
        });

        // Leads Upsert
        try {
            await this.leadsService.upsert(userId, from, text, senderName);
        } catch (e) {
            this.logger.error('Error tracking lead', e);
        }

        // Check Pause
        if (this.isBotPaused(userId)) {
            this.logger.log(`Bot paused for ${userId}, skipping auto-reply.`);
            return;
        }

        const msg = text.toLowerCase();

        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";
        const allVehicles = await this.vehiclesService.findAll(userId);

        const strictMatchVehicles = allVehicles.filter(v => {
            const searchTerms = [v.name, v.brand, v.model, v.year?.toString()].map(t => t?.toLowerCase() || '');
            return searchTerms.some(term => term && term.length > 2 && msg.includes(term));
        });

        let contextVehicles = strictMatchVehicles;
        let aiContextVehicles = allVehicles.length > 50 ? allVehicles.slice(0, 50) : allVehicles;

        const ignoreTerms = ['bom', 'boa', 'tarde', 'noite', 'dia', 'ola', 'olá', 'tudo', 'bem', 'sim', 'não', 'quero'];
        // const isGeneric = ignoreTerms.includes(msg) || msg.length <= 3;

        let shouldShowCars = false;
        let responseText = '';

        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];
            if (greetings.some(g => msg === g || (msg.includes(g) && msg.length < 10))) {
                shouldShowCars = false;
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver tudo.`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                shouldShowCars = false;
                return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
            }

            if (strictMatchVehicles.length > 0) {
                contextVehicles = strictMatchVehicles;
                shouldShowCars = true;
                return `Encontrei ${strictMatchVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo')) {
                contextVehicles = allVehicles.slice(0, 5);
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            return `Poxa, procurei aqui e não encontrei nenhum carro com nome *"${text}"* no momento. 😕\n\nMas temos muitas outras opções! Digite *Estoque* para ver o que chegou.`;
        };

        const faqMatch = await this.faqService.findMatch(userId, msg);

        if (faqMatch) {
            responseText = faqMatch;
            shouldShowCars = false;
        } else if (this.model) {
            try {
                const params = aiContextVehicles.map(v => `- ${v.brand} ${v.name} ${v.model} (${v.year})`).join('\n');
                const prompt = `
                Você é um consultor de vendas especialista da loja "${storeName}".
                ** Contexto **
                Mensagem do Cliente: "${text}"
                ** Estoque Atual **
                ${params}
                
                ** Missão **
                Identificar se o cliente está buscando um carro específico.
                
                ** Regras **
                - SAUDAÇÃO: Responda com cordialidade. [NO_CARS]
                - BUSCA ESPECÍFICA: [SHOW_CARS] se houver match.
                - CURIOSIDADE ("Quero ver o estoque"): [SHOW_CARS].
                - Se não tiver certeza: [NO_CARS].
                
                Retorne apenas a resposta do bot seguida da flag [SHOW_CARS] ou [NO_CARS].
                `;

                const result = await this.model.generateContent(prompt);
                const aiResponse = result.response.text();

                if (aiResponse.includes('[SHOW_CARS]')) shouldShowCars = true;
                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/g, '').trim();

            } catch (error) {
                this.logger.error('AI Failed', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        // Send Reply
        await this.sendMessage(userId, from, responseText);

        // Log Bot Reply
        this.logMessage(userId, from, 'bot', responseText, storeName + ' (Bot)', true);
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'bot-' + Date.now(),
            from: 'bot',
            body: responseText,
            timestamp: Date.now() / 1000,
            senderName: storeName + ' (Bot)',
            isBot: true
        });

        // Send Cars
        if (shouldShowCars && contextVehicles.length > 0) {
            const vehiclesToShow = contextVehicles.length === 0 ? allVehicles.slice(0, 3) : contextVehicles;

            for (const car of vehiclesToShow.slice(0, 5)) {
                // Construct Specs
                const features: string[] = [];
                if (car.trava) features.push('Trava');
                if (car.alarme) features.push('Alarme');
                if (car.som) features.push('Som');
                if (car.teto) features.push('Teto Solar');
                if (car.banco_couro) features.push('Banco de Couro');

                const featuresText = features.length > 0 ? `✨ Opcionais: ${features.join(', ')}\n` : '';
                const specs = `🔹 *${car.brand} ${car.name}* ${car.model || ''}
📅 Ano: ${car.year} | 🚦 Km: ${car.km || 'N/A'}
⛽ Combustível: ${car.fuel} | ⚙️ Câmbio: ${car.transmission}
🎨 Cor: ${car.color}
${featuresText}💰 *R$ ${Number(car.price).toLocaleString('pt-BR')}*

_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                await this.sendMessage(userId, from, specs);

                // Log Car Specs
                this.logMessage(userId, from, 'bot', specs, storeName + ' (Bot)', true);
                this.chatGateway.emitMessageToRoom(userId, {
                    id: 'bot-car-' + car.id,
                    from: 'bot',
                    body: specs,
                    timestamp: Date.now() / 1000,
                    senderName: storeName + ' (Bot)',
                    isBot: true
                });

                const delay = (ms) => new Promise(r => setTimeout(r, ms));
                await delay(800);

                // Send Images
                if (car.images && car.images.length > 0) {
                    for (const imageUrl of car.images.slice(0, 4)) {
                        if (!imageUrl) continue;
                        let finalUrl = imageUrl;
                        if (imageUrl.startsWith('/')) {
                            // In Docker/Production, we need a URL accessible by Evolution API container
                            const baseUrl = this.configService.get('WEBHOOK_URL')
                                ? this.configService.get('WEBHOOK_URL').replace('/whatsapp/webhook', '') // http://backend:3000
                                : `http://localhost:${process.env.PORT || 3000}`;

                            finalUrl = `${baseUrl}${imageUrl}`;
                        }
                        await this.sendImage(userId, from, finalUrl, car.name);
                        await delay(1000);
                    }
                }

                await this.sendMessage(userId, from, '--------------------------------');
                await delay(500);
            }
        }
    }
}
